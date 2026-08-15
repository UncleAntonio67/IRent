import path from 'node:path'
import { cp, link, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { config } from '../config.js'
import { prisma } from '../db.js'

const SNAPSHOT_VERSION = 1
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000
const SCHEDULED_BACKUP_SLOTS = [
  { hour: 12, minute: 0, reason: 'scheduled_noon' },
  { hour: 20, minute: 0, reason: 'scheduled_evening' },
]
const ACTIVITY_BACKUP_DELAY_MS = 30 * 60 * 1000
const CURRENT_VERSION_FILE = 'current-version.json'
let schedulerStarted = false
const tenantBackupLocks = new Map()
const pendingActivityBackups = new Map()
let activityBackupTimer = null

function safeSegment(value) {
  const result = String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '')
  if (!result) throw new Error('Invalid backup identifier')
  return result
}

function tenantBackupRoot(tenantId) {
  return path.join(config.backups.directory, safeSegment(tenantId))
}

function tenantUploadRoot(tenantId) {
  return path.join(config.uploads.directory, safeSegment(tenantId))
}

function currentVersionPath(tenantId) {
  return path.join(tenantBackupRoot(tenantId), CURRENT_VERSION_FILE)
}

function chinaDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value)
}

function snapshotId(reason) {
  return `${chinaDate().replace(/-/g, '')}_${Date.now()}_${safeSegment(reason || 'daily')}`
}

function getShanghaiDateParts(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(value).reduce((result, part) => ({ ...result, [part.type]: part.value }), {})
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute),
  }
}

function nextScheduledBackup(now = new Date()) {
  const china = getShanghaiDateParts(now)
  const currentWallTime = Date.UTC(china.year, china.month - 1, china.day, china.hour, china.minute)
  const candidates = SCHEDULED_BACKUP_SLOTS.map((slot) => {
    let wallTime = Date.UTC(china.year, china.month - 1, china.day, slot.hour, slot.minute)
    if (currentWallTime >= wallTime) wallTime += 24 * 60 * 60 * 1000
    return { at: wallTime - SHANGHAI_OFFSET_MS, reason: slot.reason }
  })
  return candidates.sort((a, b) => a.at - b.at)[0]
}

async function withTenantBackupLock(tenantId, task) {
  const key = safeSegment(tenantId)
  const previous = tenantBackupLocks.get(key) || Promise.resolve()
  const current = previous.catch(() => {}).then(task)
  tenantBackupLocks.set(key, current)
  try {
    return await current
  } finally {
    if (tenantBackupLocks.get(key) === current) tenantBackupLocks.delete(key)
  }
}

function scheduleNextActivityBackup() {
  if (activityBackupTimer) clearTimeout(activityBackupTimer)
  activityBackupTimer = null
  const nextDueAt = Math.min(...[...pendingActivityBackups.values()])
  if (!Number.isFinite(nextDueAt)) return
  activityBackupTimer = setTimeout(async () => {
    activityBackupTimer = null
    const now = Date.now()
    const dueTenantIds = [...pendingActivityBackups.entries()]
      .filter(([, dueAt]) => dueAt <= now)
      .map(([tenantId]) => tenantId)
    for (const tenantId of dueTenantIds) {
      const dueAt = pendingActivityBackups.get(tenantId)
      if (!dueAt || dueAt > Date.now()) continue
      pendingActivityBackups.delete(tenantId)
      try {
        await createBackup({ tenantId, reason: 'activity_quiet' })
      } catch (error) {
        console.error('[backup] quiet-period snapshot failed', tenantId, error.message)
        // Keep a failed quiet-period backup eligible for one later retry.
        pendingActivityBackups.set(tenantId, Date.now() + 5 * 60 * 1000)
      }
    }
    scheduleNextActivityBackup()
  }, Math.max(1000, nextDueAt - Date.now()))
  activityBackupTimer.unref()
}

// Called after a successful business mutation. Repeated writes only move the
// deadline forward, yielding one snapshot 30 minutes after the final action.
export function noteTenantBackupActivity(tenantId) {
  if (!tenantId) return
  pendingActivityBackups.set(String(tenantId), Date.now() + ACTIVITY_BACKUP_DELAY_MS)
  scheduleNextActivityBackup()
}

async function exists(target) {
  try { await stat(target); return true } catch { return false }
}

async function mirrorUploadsWithLinks(source, target) {
  await mkdir(target, { recursive: true })
  let copiedFiles = 0
  let linkedFiles = 0
  const entries = await readdir(source, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)
    if (entry.isDirectory()) {
      const result = await mirrorUploadsWithLinks(sourcePath, targetPath)
      copiedFiles += result.copiedFiles
      linkedFiles += result.linkedFiles
      continue
    }
    if (!entry.isFile()) continue
    try {
      // Backups and uploads share the Docker volume by default. A hard link
      // keeps the snapshot restorable without duplicating image bytes.
      await link(sourcePath, targetPath)
      linkedFiles += 1
    } catch {
      // A different filesystem or host policy can forbid hard links. Keep the
      // backup complete by falling back to a normal copy in that case.
      await cp(sourcePath, targetPath)
      copiedFiles += 1
    }
  }
  return { copiedFiles, linkedFiles }
}

async function getUniqueDirectorySize(root) {
  if (!await exists(root)) return 0
  const seenFiles = new Set()
  async function visit(target) {
    let total = 0
    const entries = await readdir(target, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(target, entry.name)
      if (entry.isDirectory()) {
        total += await visit(entryPath)
        continue
      }
      if (!entry.isFile()) continue
      const details = await stat(entryPath)
      // Do not count hard-linked attachments once per snapshot.
      const key = `${details.dev || ''}:${details.ino || entryPath}`
      if (seenFiles.has(key)) continue
      seenFiles.add(key)
      total += Number(details.blocks ? details.blocks * 512 : details.size || 0)
    }
    return total
  }
  return visit(root)
}

async function readTenantSnapshot(tenantId) {
  const roomScope = { floor: { block: { property: { tenantId } } } }
  const [properties, blocks, floors, rooms, occupancies, paymentTerms, bills, meterReadings, collections, attachments, operationLogs, exportTasks] = await Promise.all([
    prisma.property.findMany({ where: { tenantId } }),
    prisma.block.findMany({ where: { property: { tenantId } } }),
    prisma.floor.findMany({ where: { block: { property: { tenantId } } } }),
    prisma.room.findMany({ where: roomScope }),
    prisma.occupancy.findMany({ where: { room: roomScope } }),
    prisma.paymentTerm.findMany({ where: { room: roomScope } }),
    prisma.bill.findMany({ where: { room: roomScope } }),
    prisma.meterReading.findMany({ where: { room: roomScope } }),
    prisma.collection.findMany({ where: { room: roomScope } }),
    prisma.attachment.findMany({ where: { tenantId } }),
    prisma.operationLog.findMany({ where: { tenantId } }),
    prisma.exportTask.findMany({ where: { tenantId } }),
  ])
  return { version: SNAPSHOT_VERSION, properties, blocks, floors, rooms, occupancies, paymentTerms, bills, meterReadings, collections, attachments, operationLogs, exportTasks }
}

function snapshotSummary(data) {
  return {
    properties: data.properties.length,
    rooms: data.rooms.length,
    collections: data.collections.length,
    attachments: data.attachments.length,
  }
}

async function pruneTenantBackups(tenantId) {
  const root = tenantBackupRoot(tenantId)
  if (!await exists(root)) return
  const cutoff = Date.now() - config.backups.retentionDays * 24 * 60 * 60 * 1000
  const entries = await readdir(root, { withFileTypes: true })
  const backups = (await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
    try {
      const manifest = JSON.parse(await readFile(path.join(root, entry.name, 'manifest.json'), 'utf8'))
      return { name: entry.name, createdAt: new Date(manifest.createdAt).getTime() || 0 }
    } catch {
      await rm(path.join(root, entry.name), { recursive: true, force: true })
      return null
    }
  }))).filter(Boolean)

  for (const backup of backups) {
    if (backup.createdAt >= cutoff) continue
    await rm(path.join(root, backup.name), { recursive: true, force: true })
  }

  // A retention window alone does not protect a small server disk when a user
  // uploads many photos. Remove the oldest snapshots until the per-tenant cap
  // is met, but always keep the newest recovery point.
  let remaining = (await listBackups(tenantId, { includeInternal: true, allVersions: true }))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  let totalBytes = await getUniqueDirectorySize(root)
  while (remaining.length > 1 && totalBytes > config.backups.maxBytes) {
    const oldest = remaining.shift()
    await rm(path.join(root, oldest.id), { recursive: true, force: true })
    totalBytes = await getUniqueDirectorySize(root)
  }
}

async function readBackupManifest(tenantId, backupId) {
  try {
    const value = JSON.parse(await readFile(path.join(tenantBackupRoot(tenantId), safeSegment(backupId), 'manifest.json'), 'utf8'))
    return { ...value, id: safeSegment(backupId) }
  } catch { return null }
}

async function setCurrentBackupVersion(tenantId, backup) {
  if (!backup?.id) return null
  await mkdir(tenantBackupRoot(tenantId), { recursive: true })
  const currentBackup = { ...backup, id: safeSegment(backup.id) }
  await writeFile(currentVersionPath(tenantId), JSON.stringify({ backupId: currentBackup.id, selectedAt: new Date().toISOString() }), 'utf8')
  return currentBackup
}

export async function listBackups(tenantId, options = {}) {
  const root = tenantBackupRoot(tenantId)
  if (!await exists(root)) return []
  const entries = await readdir(root, { withFileTypes: true })
  const backups = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
    try {
      const manifest = JSON.parse(await readFile(path.join(root, entry.name, 'manifest.json'), 'utf8'))
      return { ...manifest, id: entry.name }
    } catch { return null }
  }))
  const sorted = backups.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  // A restore creates an internal safety point before replacing data. Keep it
  // available on disk, but do not make it look like a new user-created backup.
  const visible = options.includeInternal ? sorted : sorted.filter((item) => item.reason !== 'pre_restore')
  if (options.allVersions) return visible

  // The recovery UI is date-oriented: one selectable version for each of the
  // most recent retention days, not every manual/quiet-period checkpoint.
  // If a user restored an older point from today, keep that exact current
  // version visible instead of replacing it with a newer same-day checkpoint.
  const currentId = String(options.currentBackupId || '')
  const byDate = new Map()
  for (const backup of visible) {
    const dateKey = String(backup.date || chinaDate(new Date(backup.createdAt)))
    const existing = byDate.get(dateKey)
    if (!existing || backup.id === currentId) byDate.set(dateKey, backup)
  }
  return [...byDate.values()]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, config.backups.retentionDays)
}

export async function getCurrentBackupVersion(tenantId) {
  try {
    const pointer = JSON.parse(await readFile(currentVersionPath(tenantId), 'utf8'))
    const selected = await readBackupManifest(tenantId, pointer?.backupId)
    if (selected && selected.reason !== 'pre_restore') return selected
  } catch {}
  // Existing installations may not yet have a pointer. Use the newest normal
  // snapshot once, so the UI remains correct before the next backup run.
  const fallback = (await listBackups(tenantId, { allVersions: true }))[0] || null
  if (fallback) await setCurrentBackupVersion(tenantId, fallback)
  return fallback
}

export async function clearBackups(tenantId) {
  return withTenantBackupLock(tenantId, async () => {
    const root = tenantBackupRoot(tenantId)
    if (!await exists(root)) return { deletedCount: 0 }
    const entries = await readdir(root, { withFileTypes: true })
    const snapshots = entries.filter((entry) => entry.isDirectory())
    await Promise.all(snapshots.map((entry) => rm(path.join(root, entry.name), { recursive: true, force: true })))
    await rm(currentVersionPath(tenantId), { force: true })
    return { deletedCount: snapshots.length }
  })
}

async function createBackupNow({ tenantId, reason = 'daily' }) {
  await mkdir(tenantBackupRoot(tenantId), { recursive: true })
  const id = snapshotId(reason)
  const target = path.join(tenantBackupRoot(tenantId), id)
  const data = await readTenantSnapshot(tenantId)
  await mkdir(target, { recursive: true })
  await writeFile(path.join(target, 'data.json'), JSON.stringify(data), 'utf8')
  const sourceUploads = tenantUploadRoot(tenantId)
  const attachmentMirror = await exists(sourceUploads)
    ? await mirrorUploadsWithLinks(sourceUploads, path.join(target, 'uploads'))
    : { linkedFiles: 0, copiedFiles: 0 }
  const manifest = {
    id,
    version: SNAPSHOT_VERSION,
    reason,
    createdAt: new Date().toISOString(),
    date: chinaDate(),
    summary: snapshotSummary(data),
    includesAttachments: true,
    attachmentMirror,
  }
  await writeFile(path.join(target, 'manifest.json'), JSON.stringify(manifest), 'utf8')
  await pruneTenantBackups(tenantId)
  if (reason !== 'pre_restore') await setCurrentBackupVersion(tenantId, manifest)
  return manifest
}

export async function createBackup({ tenantId, reason = 'daily' }) {
  return withTenantBackupLock(tenantId, () => createBackupNow({ tenantId, reason }))
}

export async function ensureDailyBackup(tenantId) {
  return ensureScheduledBackup(tenantId, 'scheduled_noon')
}

export async function ensureScheduledBackup(tenantId, reason) {
  return withTenantBackupLock(tenantId, async () => {
    const today = chinaDate()
    const backups = await listBackups(tenantId, { includeInternal: true, allVersions: true })
    if (backups.some((item) => item.date === today && item.reason === reason)) return null
    return createBackupNow({ tenantId, reason })
  })
}

async function restoreSnapshotData(tenantId, data) {
  if (Number(data?.version) !== SNAPSHOT_VERSION) throw new Error('Unsupported backup version')
  await prisma.$transaction(async (tx) => {
    await tx.exportTask.deleteMany({ where: { tenantId } })
    await tx.operationLog.deleteMany({ where: { tenantId } })
    await tx.attachment.deleteMany({ where: { tenantId } })
    await tx.property.deleteMany({ where: { tenantId } })
    if (data.properties?.length) await tx.property.createMany({ data: data.properties })
    if (data.blocks?.length) await tx.block.createMany({ data: data.blocks })
    if (data.floors?.length) await tx.floor.createMany({ data: data.floors })
    if (data.rooms?.length) await tx.room.createMany({ data: data.rooms })
    if (data.occupancies?.length) await tx.occupancy.createMany({ data: data.occupancies })
    if (data.paymentTerms?.length) await tx.paymentTerm.createMany({ data: data.paymentTerms })
    if (data.bills?.length) await tx.bill.createMany({ data: data.bills })
    if (data.meterReadings?.length) await tx.meterReading.createMany({ data: data.meterReadings })
    if (data.collections?.length) await tx.collection.createMany({ data: data.collections })
    if (data.attachments?.length) await tx.attachment.createMany({ data: data.attachments })
    if (data.operationLogs?.length) await tx.operationLog.createMany({ data: data.operationLogs })
    if (data.exportTasks?.length) await tx.exportTask.createMany({ data: data.exportTasks })
  }, { timeout: 30000 })
}

export async function restoreBackup({ tenantId, backupId }) {
  return withTenantBackupLock(tenantId, async () => {
    const id = safeSegment(backupId)
    const target = path.join(tenantBackupRoot(tenantId), id)
    const dataPath = path.join(target, 'data.json')
    if (!await exists(dataPath)) {
      const error = new Error('Backup not found')
      error.statusCode = 404
      error.code = 'BACKUP_NOT_FOUND'
      throw error
    }
    // Preserve the state immediately before a destructive restore.
    await createBackupNow({ tenantId, reason: 'pre_restore' })
    const data = JSON.parse(await readFile(dataPath, 'utf8'))
    await restoreSnapshotData(tenantId, data)
    const uploads = tenantUploadRoot(tenantId)
    await rm(uploads, { recursive: true, force: true })
    const backedUpUploads = path.join(target, 'uploads')
    if (await exists(backedUpUploads)) await cp(backedUpUploads, uploads, { recursive: true })
    const currentBackup = await readBackupManifest(tenantId, id)
    if (currentBackup) await setCurrentBackupVersion(tenantId, currentBackup)
    return { restoredAt: new Date().toISOString(), summary: snapshotSummary(data), currentBackup }
  })
}

export function startBackupScheduler() {
  if (schedulerStarted) return
  schedulerStarted = true
  const run = async (reason) => {
    const tenants = await prisma.tenant.findMany({ select: { id: true } })
    // Process tenants one by one in the off-peak window instead of creating
    // concurrent database and filesystem load during normal use.
    for (const { id } of tenants) {
      try { await ensureScheduledBackup(id, reason) } catch (error) { console.error('[backup] scheduled snapshot failed', id, error.message) }
    }
  }
  const scheduleNextRun = () => {
    const next = nextScheduledBackup()
    const delay = Math.max(1000, next.at - Date.now())
    setTimeout(async () => {
      try { await run(next.reason) } catch (error) { console.error('[backup] scheduler failed', error.message) }
      scheduleNextRun()
    }, delay).unref()
  }
  // Do not snapshot on service start: it can coincide with user traffic.
  // The next run is scheduled for 12:00 or 20:00 China Standard Time.
  scheduleNextRun()
}
