import { buildTenantStorageKey } from './authStore.js'
import { canUseCloudBackup, withCloudBackupAccess } from '../config/cloud.js'
import { submitPropertiesTreeSnapshot } from '../api/properties.js'
import {
  fetchRoomDetail,
  submitMeterReading,
  submitRentCollection,
  submitRoomCheckIn,
  submitRoomCheckout,
  submitUtilityCollection,
} from '../api/rooms.js'
import { uploadAttachmentForRoom } from '../api/attachments.js'
import { mergeCloudRoomDetail, setProperties } from './rentStore.js'

const SYNC_QUEUE_STORAGE_KEY = 'cloud_sync_queue_v1'
const SYNC_META_STORAGE_KEY = 'cloud_sync_meta_v1'
const SYNC_MODE_STORAGE_KEY = 'cloud_sync_mode_v1'
const MAX_RETRY_COUNT = 5
const RETRY_DELAYS_MS = [5000, 15000, 30000, 60000, 180000]
let processing = false

function loadQueue() {
  try {
    return uni.getStorageSync(buildTenantStorageKey(SYNC_QUEUE_STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function saveQueue(nextQueue) {
  try {
    uni.setStorageSync(buildTenantStorageKey(SYNC_QUEUE_STORAGE_KEY), nextQueue || [])
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

function nextRetryDelay(attemptCount) {
  return RETRY_DELAYS_MS[Math.min(Math.max(attemptCount - 1, 0), RETRY_DELAYS_MS.length - 1)]
}

function hasPendingSyncTasks() {
  return loadQueue().length > 0
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
  switch (task.type) {
    case 'properties.treeSync':
      return submitPropertiesTreeSnapshot(task.payload?.tree || [])
    case 'room.checkin':
      return submitRoomCheckIn(roomId, task.payload)
    case 'room.rentCollection': {
      const nextPayload = await resolveQueueAttachmentIds(roomId, task.payload)
      return submitRentCollection(roomId, nextPayload)
    }
    case 'room.utilityCollection': {
      const nextPayload = await resolveQueueAttachmentIds(roomId, task.payload)
      return submitUtilityCollection(roomId, nextPayload)
    }
    case 'room.meterReading': {
      const nextPayload = await resolveQueueAttachmentIds(roomId, task.payload)
      return submitMeterReading(roomId, nextPayload)
    }
    case 'room.checkout':
      return submitRoomCheckout(roomId, task.payload)
    case 'attachment.upload':
      return uploadAttachmentForRoom({
        roomId,
        type: task.payload?.type,
        file: task.payload?.file,
      }).then(() => fetchRoomDetail(roomId))
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
  if (task.propertyId && task.blockId && task.roomId) {
    mergeCloudRoomDetail(task.propertyId, task.blockId, task.roomId, detail)
  }
}

export function getPendingSyncTasks() {
  return loadQueue()
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
  }
}

export function enqueueSyncTask({ type, propertyId, blockId, roomId, payload }) {
  if (!type || !canUseCloudBackup()) return null
  const requiresRoomId = type !== 'properties.treeSync'
  if (requiresRoomId && !roomId) return null
  const task = {
    id: buildTaskId(),
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
  const nextQueue = type === 'properties.treeSync'
    ? [...existingQueue.filter((item) => item.type !== 'properties.treeSync'), task]
    : [...existingQueue, task]
  saveQueue(nextQueue)
  if (getSyncMode() === 'realtime') {
    setTimeout(() => { void processSyncQueue({ source: 'auto' }) }, 0)
  }
  return task
}

export async function processSyncQueue(options = {}) {
  if (processing || !canUseCloudBackup()) return
  const source = options?.source === 'manual' ? 'manual' : 'auto'
  if (source === 'auto' && getSyncMode() === 'manual') return
  processing = true
  try {
    await withCloudBackupAccess(async () => {
      let queue = loadQueue()
      while (queue.length) {
        const [currentTask] = queue
        if (!currentTask) break
        if (Number(currentTask.nextRetryAt || 0) > Date.now()) break
        try {
          const detail = await executeTask(currentTask)
          applyTaskResult(currentTask, detail)
          queue = queue.slice(1)
          saveQueue(queue)
          saveMeta({
            ...loadMeta(),
            lastSuccessAt: Date.now(),
            lastError: '',
          })
        } catch (error) {
          const attemptCount = Number(currentTask.attemptCount || 0) + 1
          if (attemptCount >= MAX_RETRY_COUNT) {
            queue = queue.slice(1)
            saveQueue(queue)
            saveMeta({
              ...loadMeta(),
              lastFailureAt: Date.now(),
              lastError: String(error?.message || error?.code || 'SYNC_FAILED'),
            })
            continue
          }
          queue[0] = {
            ...currentTask,
            attemptCount,
            lastError: String(error?.message || error?.code || 'SYNC_FAILED'),
            nextRetryAt: Date.now() + nextRetryDelay(attemptCount),
          }
          saveQueue(queue)
          saveMeta({
            ...loadMeta(),
            lastFailureAt: Date.now(),
            lastError: String(error?.message || error?.code || 'SYNC_FAILED'),
          })
          break
        }
      }
    })
  } finally {
    processing = false
  }
}

export function startSyncQueue() {
  if (!hasPendingSyncTasks() || getSyncMode() === 'manual') return false
  void processSyncQueue({ source: 'auto' })
  return true
}
