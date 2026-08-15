import { buildTenantStorageKey } from './authStore.js'
import { canUseCloudBackup, withCloudBackupAccess } from '../config/cloud.js'
import { submitPropertiesTreeSnapshot } from '../api/properties.js'
import {
  submitMeterReading,
  submitRentCollection,
  submitRoomCheckIn,
  submitRoomCheckout,
  submitLatestCollectionUndo,
  submitLatestRoomOperationUndo,
  submitUtilityCollection,
} from '../api/rooms.js'
import { deleteRoomAttachmentFromCloud, uploadAttachmentForRoom } from '../api/attachments.js'
import { cloneProperties, mergeCloudRoomDetail, setProperties } from './rentStore.js'
import { notifySyncStatusChanged } from './syncStatus.js'

const SYNC_QUEUE_STORAGE_KEY = 'cloud_sync_queue_v1'
const SYNC_META_STORAGE_KEY = 'cloud_sync_meta_v1'
const SYNC_MODE_STORAGE_KEY = 'cloud_sync_mode_v1'
const CLOUD_SOURCE_READY_KEY = 'cloud_source_ready_v3'
const QUEUE_SCHEMA_VERSION = 2
// Keep the first few retries fast after a network switch. Operations still
// stay strictly FIFO, so a slow attachment or payment can never overtake an
// earlier business action.
const RETRY_DELAYS_MS = [800, 2000, 5000, 10000, 20000]
let processing = false
let retryTimer = null
let activeTaskId = ''
let activeTaskType = ''
let batchTotal = 0
let batchCompleted = 0

function loadQueue() {
  try {
    const currentKey = buildTenantStorageKey(SYNC_QUEUE_STORAGE_KEY)
    const current = uni.getStorageSync(currentKey) || []
    // This app has one shared tenant. An offline app launch can restore its
    // cloud session after the queue starts, changing the storage namespace
    // and making valid offline check-ins look permanently stuck. Merge legacy
    // queue namespaces until the next save consolidates them into the active
    // shared account namespace.
    const storageKeys = uni.getStorageInfoSync?.().keys || []
    const legacyQueues = storageKeys
      .filter((key) => key !== currentKey && String(key).startsWith(`${SYNC_QUEUE_STORAGE_KEY}__`))
      .flatMap((key) => {
        const value = uni.getStorageSync(key)
        return Array.isArray(value) ? value : []
      })
    const seen = new Set()
    return [...(Array.isArray(current) ? current : []), ...legacyQueues]
      .filter((task) => {
        const id = String(task?.id || '')
        if (!id || seen.has(id)) return false
        seen.add(id)
        return true
      })
  } catch {
    return []
  }
}

function saveQueue(nextQueue) {
  try {
    const currentKey = buildTenantStorageKey(SYNC_QUEUE_STORAGE_KEY)
    uni.setStorageSync(currentKey, nextQueue || [])
    // Consolidation is performed only after the complete merged queue has
    // been written, so changing login namespace cannot discard offline work.
    const storageKeys = uni.getStorageInfoSync?.().keys || []
    storageKeys
      .filter((key) => key !== currentKey && String(key).startsWith(`${SYNC_QUEUE_STORAGE_KEY}__`))
      .forEach((key) => uni.removeStorageSync(key))
    notifySyncStatusChanged()
  } catch {
    // Ignore storage failures. Queue durability is best effort on device.
  }
}

function loadMeta() {
  try {
    return uni.getStorageSync(buildTenantStorageKey(SYNC_META_STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveMeta(nextMeta) {
  try {
    uni.setStorageSync(buildTenantStorageKey(SYNC_META_STORAGE_KEY), nextMeta || {})
    notifySyncStatusChanged()
  } catch {
    // Ignore storage failures. Sync metadata is best effort on device.
  }
}

export function getSyncMode() {
  try {
    const stored = String(uni.getStorageSync(buildTenantStorageKey(SYNC_MODE_STORAGE_KEY)) || '').trim()
    return stored === 'manual' ? 'manual' : 'realtime'
  } catch {
    return 'realtime'
  }
}

export function setSyncMode(mode) {
  const nextMode = mode === 'manual' ? 'manual' : 'realtime'
  try {
    uni.setStorageSync(buildTenantStorageKey(SYNC_MODE_STORAGE_KEY), nextMode)
  } catch {
    // Ignore storage failures. Preference persistence is best effort on device.
  }
  return nextMode
}

function buildTaskId() {
  return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Reuse this key for the immediate cloud request and its offline fallback.
// If the request reaches the server but the device loses the response, the
// later retry resolves to the same server operation instead of charging twice.
export function createClientOperationId(prefix = 'operation') {
  return `${String(prefix || 'operation').replace(/[^a-z0-9_.-]/gi, '_')}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function nextRetryDelay(attemptCount) {
  return RETRY_DELAYS_MS[Math.min(Math.max(attemptCount - 1, 0), RETRY_DELAYS_MS.length - 1)]
}

function prioritizeQueuedCheckIns(queue = []) {
  const next = [...queue]
  let changed = false
  for (let index = 0; index < next.length; index += 1) {
    const task = next[index]
    if (task?.type !== 'room.checkin' || !task.roomId) continue
    const attachmentIndex = next.findIndex((item, candidateIndex) => (
      candidateIndex < index
      && item?.type === 'attachment.upload'
      && String(item.roomId || '') === String(task.roomId)
    ))
    if (attachmentIndex < 0) continue
    next.splice(index, 1)
    next.splice(attachmentIndex, 0, task)
    changed = true
  }
  return { queue: next, changed }
}

function clearScheduledRetry() {
  if (!retryTimer) return
  clearTimeout(retryTimer)
  retryTimer = null
}

function scheduleNextRetry() {
  clearScheduledRetry()
  const currentTask = loadQueue()[0]
  if (!currentTask) return
  const nextRetryAt = Number(currentTask.nextRetryAt || 0)
  if (!nextRetryAt) return
  const delay = Math.max(1000, nextRetryAt - Date.now())
  retryTimer = setTimeout(() => {
    retryTimer = null
    void processSyncQueue({ source: 'auto' })
  }, delay)
}

export function hasPendingSyncTasks() {
  return loadQueue().length > 0
}

export function hasPendingSyncForRoom(roomId) {
  const targetRoomId = String(roomId || '')
  return Boolean(targetRoomId && loadQueue().some((task) => String(task.roomId || '') === targetRoomId))
}

// An image chosen while offline is represented by an attachment-upload task.
// If the user removes that thumbnail before it reaches the server, remove the
// matching task as well; otherwise the image would reappear after sync.
export function discardPendingAttachmentUpload(roomId, fileOrId) {
  const targetRoomId = String(roomId || '')
  const targetFile = typeof fileOrId === 'object' && fileOrId
    ? fileOrId
    : { id: String(fileOrId || '') }
  const targetFileId = String(targetFile.id || '')
  const targetOperationId = String(targetFile.clientOperationId || '')
  const targetPath = String(targetFile.filePath || targetFile.url || '')
  if (!targetRoomId || (!targetFileId && !targetOperationId && !targetPath)) return false
  const current = loadQueue()
  const next = current.filter((task) => !(
    task.type === 'attachment.upload'
    && String(task.roomId || '') === targetRoomId
    && (() => {
      const queuedFile = task.payload?.file || {}
      const queuedId = String(queuedFile.id || '')
      const queuedOperationId = String(queuedFile.clientOperationId || '')
      const queuedPath = String(queuedFile.filePath || queuedFile.url || '')
      return (targetFileId && queuedId && targetFileId === queuedId)
        || (targetOperationId && queuedOperationId && targetOperationId === queuedOperationId)
        || (targetPath && queuedPath && targetPath === queuedPath)
    })()
  ))
  if (next.length === current.length) return false
  saveQueue(next)
  return true
}

function getNetworkType() {
  return new Promise((resolve) => {
    try {
      uni.getNetworkType({
        success: (result) => resolve(String(result?.networkType || '').toLowerCase()),
        fail: () => resolve(''),
      })
    } catch {
      resolve('')
    }
  })
}

function currentWeeklyBackupSlot(now = new Date()) {
  const slot = new Date(now)
  slot.setHours(0, 0, 0, 0)
  const day = slot.getDay()
  slot.setDate(slot.getDate() - day)
  return slot.getTime()
}

function nextWeeklyBackupAt(now = new Date()) {
  const next = new Date(currentWeeklyBackupSlot(now))
  next.setDate(next.getDate() + 7)
  return next.getTime()
}

function isWeeklyBackupDue() {
  const meta = loadMeta()
  const currentSlot = currentWeeklyBackupSlot()
  return Number(meta.lastSuccessAt || 0) < currentSlot
}

async function ensureUploadedAttachmentId(roomId, type, file) {
  if (!roomId || !file) return ''
  if (file.id) return String(file.id)
  const uploaded = await uploadAttachmentForRoom({ roomId, type, file })
  return String(uploaded?.id || '')
}

async function resolveQueueAttachmentIds(roomId, payload = {}) {
  const nextPayload = {
    ...payload,
    attachmentIds: Array.isArray(payload.attachmentIds) ? [...payload.attachmentIds].filter(Boolean) : [],
  }

  if (nextPayload.receiptFile && nextPayload.attachmentIds.length === 0) {
    const receiptAttachmentId = await ensureUploadedAttachmentId(roomId, 'receipt', nextPayload.receiptFile)
    if (receiptAttachmentId) nextPayload.attachmentIds = [receiptAttachmentId]
  }

  if (nextPayload.meterPhotoFiles) {
    const meterFiles = Object.values(nextPayload.meterPhotoFiles || {}).filter(Boolean)
    for (const file of meterFiles) {
      const meterAttachmentId = await ensureUploadedAttachmentId(roomId, 'meterPhoto', file)
      if (meterAttachmentId && !nextPayload.attachmentIds.includes(meterAttachmentId)) {
        nextPayload.attachmentIds.push(meterAttachmentId)
      }
    }
  }

  delete nextPayload.receiptFile
  delete nextPayload.meterPhotoFiles
  return nextPayload
}

async function executeTask(task) {
  const roomId = task.roomId
  const payload = task.roomId
    ? { ...(task.payload || {}), clientOperationId: task.payload?.clientOperationId || task.id }
    : task.payload
  switch (task.type) {
    case 'properties.treeSync':
      return submitPropertiesTreeSnapshot(task.payload?.tree || [])
    case 'room.checkin':
      return submitRoomCheckIn(roomId, payload)
    case 'room.rentCollection': {
      const nextPayload = await resolveQueueAttachmentIds(roomId, payload)
      return submitRentCollection(roomId, nextPayload)
    }
    case 'room.utilityCollection': {
      const nextPayload = await resolveQueueAttachmentIds(roomId, payload)
      return submitUtilityCollection(roomId, nextPayload)
    }
    case 'room.meterReading': {
      const nextPayload = await resolveQueueAttachmentIds(roomId, payload)
      return submitMeterReading(roomId, nextPayload)
    }
    case 'room.checkout':
      return submitRoomCheckout(roomId, payload)
    case 'room.undoCollection':
      return submitLatestCollectionUndo(roomId, payload)
    case 'room.undoOperation':
      return submitLatestRoomOperationUndo(roomId, payload)
    case 'attachment.upload':
      // Upload confirmation is already the durable server-side mutation.
      // Do not make this queue item depend on a second room-detail request:
      // a transient failure of that refresh used to re-upload the same file
      // (and block every later operation in the FIFO queue).
      return uploadAttachmentForRoom({
        roomId,
        type: task.payload?.type,
        file: task.payload?.file,
        clientOperationId: task.payload?.clientOperationId || task.payload?.file?.clientOperationId || task.id,
      })
    case 'attachment.delete':
      // A successful delete needs no follow-up fetch.  The local thumbnail
      // has already been removed and an eventual page refresh reads cloud
      // state normally.
      return deleteRoomAttachmentFromCloud(
        roomId,
        task.payload?.attachmentType || 'roomPhoto',
        task.payload?.file || task.payload?.photo || { id: task.payload?.attachmentId },
      )
    default: {
      const error = new Error(`UNSUPPORTED_SYNC_TASK:${task.type}`)
      error.code = 'UNSUPPORTED_SYNC_TASK'
      throw error
    }
  }
}

function applyTaskResult(task, detail) {
  if (!task || !detail) return
  if (task.type === 'properties.treeSync') {
    if (Array.isArray(detail)) setProperties(detail)
    return
  }
  // /attachments/confirm returns an attachment, not a room detail.  Treating
  // that response as a room used to Object.assign its file fields onto the
  // room itself, which made a just-selected image (and sometimes the room
  // state) disappear on the next local refresh.
  if (task.type === 'attachment.upload') {
    mergeUploadedAttachment(task, detail)
    return
  }
  // A deletion result is a small acknowledgement, never a room detail.
  // Do not merge it into the room after a queued delete succeeds.
  if (task.type === 'attachment.delete') return
  if (task.propertyId && task.blockId && task.roomId) {
    // Files can be selected before an offline check-in is confirmed. Their
    // upload may succeed first, but the returned cloud room is still empty.
    // Never let that stale detail erase the newer local check-in waiting in
    // this same durable queue.
    const hasLaterBusinessMutation = task.type === 'attachment.upload' && loadQueue().some((item) => (
      item.id !== task.id
      && String(item.roomId || '') === String(task.roomId || '')
      && item.type !== 'attachment.upload'
    ))
    if (hasLaterBusinessMutation) return
    mergeCloudRoomDetail(
      task.propertyId,
      task.blockId,
      task.roomId,
      task.type === 'room.checkin' ? preservePendingAttachmentsInRoomDetail(task, detail) : detail,
    )
  }
}

function sameQueuedFile(localFile, queuedFile) {
  if (!localFile || !queuedFile) return false
  const localOperationId = String(localFile.clientOperationId || '')
  const queuedOperationId = String(queuedFile.clientOperationId || '')
  if (localOperationId && queuedOperationId && localOperationId === queuedOperationId) return true
  const localId = String(localFile.id || '')
  const queuedId = String(queuedFile.id || '')
  if (localId && queuedId && localId === queuedId) return true
  const localPath = String(localFile.filePath || localFile.url || '')
  const queuedPath = String(queuedFile.filePath || queuedFile.url || '')
  return Boolean(localPath && queuedPath && localPath === queuedPath)
}

function mergeUploadedAttachment(task, confirmedFile) {
  const type = String(task.payload?.type || '')
  const queuedFile = task.payload?.file || {}
  if (!['idCard', 'contract', 'roomPhoto'].includes(type)) return false

  const nextProperties = cloneProperties()
  const property = nextProperties.find((item) => String(item.id) === String(task.propertyId || ''))
  const block = property?.blocks?.find((item) => String(item.id) === String(task.blockId || ''))
  const room = block?.floors
    ?.flatMap((floor) => floor.rooms || [])
    .find((item) => String(item.id) === String(task.roomId || ''))
  if (!room) return false

  const cloudFile = {
    ...queuedFile,
    ...confirmedFile,
    clientOperationId: queuedFile.clientOperationId || '',
    source: 'cloud',
  }
  if (type === 'roomPhoto') {
    const current = Array.isArray(room.roomPhotos) ? room.roomPhotos : []
    const index = current.findIndex((item) => sameQueuedFile(item, queuedFile))
    room.roomPhotos = index >= 0
      ? current.map((item, itemIndex) => itemIndex === index ? { ...item, ...cloudFile } : item)
      : [...current, cloudFile]
  } else {
    const currentFiles = Array.isArray(room.attachmentFiles?.[type])
      ? room.attachmentFiles[type]
      : (room.attachmentFiles?.[type] ? [room.attachmentFiles[type]] : [])
    const index = currentFiles.findIndex((item) => sameQueuedFile(item, queuedFile))
    const nextFiles = index >= 0
      ? currentFiles.map((item, itemIndex) => itemIndex === index ? { ...item, ...cloudFile } : item)
      : [...currentFiles, cloudFile]
    room.attachmentFiles = { ...(room.attachmentFiles || {}), [type]: nextFiles }
    if (type === 'idCard') room.hasIdCardPic = true
    if (type === 'contract') room.hasContract = true
  }
  setProperties(nextProperties)
  return true
}

function findLocalRoom(tree, task) {
  const property = tree.find((item) => String(item.id) === String(task.propertyId || ''))
  const block = property?.blocks?.find((item) => String(item.id) === String(task.blockId || ''))
  return block?.floors
    ?.flatMap((floor) => floor.rooms || [])
    .find((item) => String(item.id) === String(task.roomId || '')) || null
}

function preservePendingAttachmentsInRoomDetail(task, cloudDetail) {
  const pendingUploads = loadQueue().filter((item) => (
    item.type === 'attachment.upload'
    && String(item.roomId || '') === String(task.roomId || '')
    && ['idCard', 'contract', 'roomPhoto'].includes(String(item.payload?.type || ''))
  ))
  if (!pendingUploads.length) return cloudDetail

  const localRoom = findLocalRoom(cloneProperties(), task)
  if (!localRoom) return cloudDetail
  const nextDetail = { ...cloudDetail }
  for (const pending of pendingUploads) {
    const type = String(pending.payload?.type || '')
    const file = pending.payload?.file || {}
    if (type === 'roomPhoto') {
      const cloudPhotos = Array.isArray(nextDetail.roomPhotos) ? nextDetail.roomPhotos : []
      const localPhoto = (localRoom.roomPhotos || []).find((item) => sameQueuedFile(item, file)) || file
      if (!cloudPhotos.some((item) => sameQueuedFile(item, file))) {
        nextDetail.roomPhotos = [...cloudPhotos, localPhoto]
      }
      continue
    }
    const cloudFiles = Array.isArray(nextDetail.attachmentFiles?.[type])
      ? nextDetail.attachmentFiles[type]
      : []
    const localFiles = Array.isArray(localRoom.attachmentFiles?.[type])
      ? localRoom.attachmentFiles[type]
      : []
    const localFile = localFiles.find((item) => sameQueuedFile(item, file)) || file
    if (!cloudFiles.some((item) => sameQueuedFile(item, file))) {
      nextDetail.attachmentFiles = {
        ...(nextDetail.attachmentFiles || {}),
        [type]: [...cloudFiles, localFile],
      }
    }
    if (type === 'idCard') nextDetail.hasIdCardPic = true
    if (type === 'contract') nextDetail.hasContract = true
  }
  return nextDetail
}

export function getPendingSyncTasks() {
  return loadQueue()
}

// A successful full-snapshot bootstrap already contains every local mutation.
// Drop obsolete incremental tasks so they cannot replay against the new cloud source.
export function clearPendingSyncTasks() {
  clearScheduledRetry()
  saveQueue([])
  saveMeta({
    ...loadMeta(),
    lastSuccessAt: Date.now(),
    lastError: '',
  })
}

export function isCloudSourceReady() {
  try { return Boolean(uni.getStorageSync(buildTenantStorageKey(CLOUD_SOURCE_READY_KEY))) } catch { return false }
}

// The first confirmed cloud snapshot is authoritative. Keep every business
// operation (including an action saved while offline); only discard obsolete
// full-tree overwrite tasks from old clients, which could erase newer cloud
// data. This is deliberately non-destructive for fees, check-ins and files.
export function markCloudSnapshotAsAuthoritative() {
  try {
    if (uni.getStorageSync(buildTenantStorageKey(CLOUD_SOURCE_READY_KEY))) return false
    const remaining = loadQueue().filter((task) => !(task.type === 'properties.treeSync' && Number(task.schemaVersion || 0) < QUEUE_SCHEMA_VERSION))
    if (remaining.length !== loadQueue().length) saveQueue(remaining)
    uni.setStorageSync(buildTenantStorageKey(CLOUD_SOURCE_READY_KEY), true)
    return true
  } catch {
    // Storage can fail in some dev runtimes. Never delete an offline business
    // operation merely because the readiness flag could not be persisted.
    return false
  }
}

export function getPendingSyncSummary() {
  const tasks = loadQueue()
  const meta = loadMeta()
  const failedCount = tasks.filter((task) => Number(task.attemptCount || 0) > 0).length
  const pendingTypeCounts = tasks.reduce((counts, task) => {
    const type = String(task?.type || '')
    if (!type) return counts
    counts[type] = Number(counts[type] || 0) + 1
    return counts
  }, {})
  return {
    count: tasks.length,
    lastCreatedAt: tasks.length ? Number(tasks[tasks.length - 1]?.createdAt || 0) : 0,
    nextRetryAt: tasks.length ? Number(tasks[0]?.nextRetryAt || 0) : 0,
    failedCount,
    lastSuccessAt: Number(meta.lastSuccessAt || 0),
    lastFailureAt: Number(meta.lastFailureAt || 0),
    lastError: String(meta.lastError || ''),
    pendingTypeCounts,
    syncMode: getSyncMode(),
    nextScheduledAt: 0,
    weeklyBackupDue: false,
    isProcessing: processing,
    activeTaskId,
    activeTaskType,
    batchTotal,
    batchCompleted,
  }
}

export function enqueueSyncTask({ type, propertyId, blockId, roomId, payload }) {
  if (!type || !canUseCloudBackup()) return null
  const requiresRoomId = type !== 'properties.treeSync'
  if (requiresRoomId && !roomId) return null
  const task = {
    id: buildTaskId(),
    schemaVersion: QUEUE_SCHEMA_VERSION,
    type,
    propertyId: String(propertyId || ''),
    blockId: String(blockId || ''),
    roomId: String(roomId || ''),
    payload: payload || {},
    createdAt: Date.now(),
    attemptCount: 0,
    nextRetryAt: 0,
    lastError: '',
  }
  const existingQueue = loadQueue()
  let nextQueue
  if (type === 'properties.treeSync') {
    nextQueue = [...existingQueue.filter((item) => item.type !== 'properties.treeSync'), task]
  } else if (type === 'room.checkin') {
    // A selected ID card/contract may already be queued as an upload. The
    // business mutation must reach the server first; otherwise an attachment
    // response for an empty cloud room can mask the newly checked-in tenant.
    const insertAt = existingQueue.findIndex((item) => (
      item.type === 'attachment.upload' && String(item.roomId || '') === String(roomId || '')
    ))
    nextQueue = [...existingQueue]
    if (insertAt >= 0) nextQueue.splice(insertAt, 0, task)
    else nextQueue.push(task)
  } else {
    nextQueue = [...existingQueue, task]
  }
  saveQueue(nextQueue)
  clearScheduledRetry()
  if (getSyncMode() === 'realtime') {
    // A brand-new online session may not yet have rendered a cloud snapshot.
    // The persisted action is still the newest user intent, so submit it now
    // instead of waiting for a later page bootstrap.
    if (!isCloudSourceReady()) markCloudSnapshotAsAuthoritative()
    // Submit immediately while connected. The persisted queue is the durable
    // fallback for an offline device, temporary network failure, or app exit.
    void processSyncQueue({ source: 'auto' })
  }
  return task
}

export async function processSyncQueue(options = {}) {
  if (processing || !canUseCloudBackup() || !isCloudSourceReady()) return
  const source = options?.source === 'manual' ? 'manual' : 'auto'
  if (source === 'auto' && getSyncMode() === 'manual') return
  processing = true
  const queuedOrder = prioritizeQueuedCheckIns(loadQueue())
  if (queuedOrder.changed) saveQueue(queuedOrder.queue)
  const initialQueue = queuedOrder.queue
  batchTotal = initialQueue.length
  batchCompleted = 0
  notifySyncStatusChanged()
  try {
    await withCloudBackupAccess(async () => {
      while (true) {
        // Reload for every item. A user can create a new local operation while
        // the previous request is in flight; never overwrite that new item.
        const queue = loadQueue()
        const [currentTask] = queue
        if (!currentTask) break
        if (!options?.force && Number(currentTask.nextRetryAt || 0) > Date.now()) {
          scheduleNextRetry()
          break
        }
        try {
          activeTaskId = currentTask.id
          activeTaskType = currentTask.type
          notifySyncStatusChanged()
          const detail = await executeTask(currentTask)
          applyTaskResult(currentTask, detail)
          const remainingQueue = loadQueue().filter((item) => item.id !== currentTask.id)
          saveQueue(remainingQueue)
          saveMeta({
            ...loadMeta(),
            lastSuccessAt: Date.now(),
            lastError: '',
          })
          batchCompleted += 1
          activeTaskId = ''
          activeTaskType = ''
          notifySyncStatusChanged()
        } catch (error) {
          const attemptCount = Number(currentTask.attemptCount || 0) + 1
          const lastError = String(error?.message || error?.code || 'SYNC_FAILED')
          const nextRetryAt = Date.now() + nextRetryDelay(attemptCount)
          const nextQueue = loadQueue().map((item) => item.id === currentTask.id
            ? { ...item, attemptCount, lastError, nextRetryAt }
            : item)
          saveQueue(nextQueue)
          saveMeta({
            ...loadMeta(),
            lastFailureAt: Date.now(),
            lastError,
          })
          activeTaskId = ''
          activeTaskType = ''
          notifySyncStatusChanged()
          // Retain failed operations indefinitely. Backoff is capped, but the
          // durable queue keeps retrying after temporary network/server faults.
          scheduleNextRetry()
          break
        }
      }
    })
  } finally {
    processing = false
    activeTaskId = ''
    activeTaskType = ''
    if (!loadQueue().length) {
      batchCompleted = batchTotal
    }
    notifySyncStatusChanged()
    scheduleNextRetry()
  }
}

export function startSyncQueue() {
  if (!hasPendingSyncTasks() || getSyncMode() === 'manual') return false
  // A local business operation is always retained and uploaded first. Do not
  // wait for a page bootstrap to mark the cloud snapshot ready after a device
  // reconnect; that wait made an online device look stuck in \"pending\".
  if (!isCloudSourceReady()) markCloudSnapshotAsAuthoritative()
  // A fresh app launch or network restoration is a useful recovery point:
  // retry a persisted operation immediately instead of making the user wait
  // for an old backoff timer from a previous session.
  void processSyncQueue({ source: 'auto', force: true })
  return true
}
