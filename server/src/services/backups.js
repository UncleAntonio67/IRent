import path from 'node:path'
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { config } from '../config.js'
import { prisma } from '../db.js'

const SNAPSHOT_VERSION = 1
let schedulerStarted = false

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

function chinaDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value)
}

function snapshotId(reason) {
  return `${chinaDate().replace(/-/g, '')}_${Date.now()}_${safeSegment(reason || 'daily')}`
}

async function exists(target) {
  try { await stat(target); return true } catch { return false }
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
  await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
    try {
      const manifest = JSON.parse(await readFile(path.join(root, entry.name, 'manifest.json'), 'utf8'))
      if (new Date(manifest.createdAt).getTime() < cutoff) await rm(path.join(root, entry.name), { recursive: true, force: true })
    } catch {
      await rm(path.join(root, entry.name), { recursive: true, force: true })
    }
  }))
}

export async function listBackups(tenantId) {
  const root = tenantBackupRoot(tenantId)
  if (!await exists(root)) return []
  const entries = await readdir(root, { withFileTypes: true })
  const backups = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
    try {
      const manifest = JSON.parse(await readFile(path.join(root, entry.name, 'manifest.json'), 'utf8'))
      return { ...manifest, id: entry.name }
    } catch { return null }
  }))
  return backups.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function createBackup({ tenantId, reason = 'daily' }) {
  await mkdir(tenantBackupRoot(tenantId), { recursive: true })
  const id = snapshotId(reason)
  const target = path.join(tenantBackupRoot(tenantId), id)
  const data = await readTenantSnapshot(tenantId)
  const manifest = { id, version: SNAPSHOT_VERSION, reason, createdAt: new Date().toISOString(), date: chinaDate(), summary: snapshotSummary(data), includesAttachments: true }
  await mkdir(target, { recursive: true })
  await writeFile(path.join(target, 'data.json'), JSON.stringify(data), 'utf8')
  const sourceUploads = tenantUploadRoot(tenantId)
  if (await exists(sourceUploads)) await cp(sourceUploads, path.join(target, 'uploads'), { recursive: true })
  await writeFile(path.join(target, 'manifest.json'), JSON.stringify(manifest), 'utf8')
  await pruneTenantBackups(tenantId)
  return manifest
}

export async function ensureDailyBackup(tenantId) {
  const today = chinaDate()
  const backups = await listBackups(tenantId)
  if (backups.some((item) => item.date === today && item.reason === 'daily')) return null
  return createBackup({ tenantId, reason: 'daily' })
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
  await createBackup({ tenantId, reason: 'pre_restore' })
  const data = JSON.parse(await readFile(dataPath, 'utf8'))
  await restoreSnapshotData(tenantId, data)
  const uploads = tenantUploadRoot(tenantId)
  await rm(uploads, { recursive: true, force: true })
  const backedUpUploads = path.join(target, 'uploads')
  if (await exists(backedUpUploads)) await cp(backedUpUploads, uploads, { recursive: true })
  return { restoredAt: new Date().toISOString(), summary: snapshotSummary(data) }
}

export function startBackupScheduler() {
  if (schedulerStarted) return
  schedulerStarted = true
  const run = async () => {
    const tenants = await prisma.tenant.findMany({ select: { id: true } })
    await Promise.all(tenants.map(async ({ id }) => {
      try { await ensureDailyBackup(id) } catch (error) { console.error('[backup] daily snapshot failed', id, error.message) }
    }))
  }
  void run().catch((error) => console.error('[backup] scheduler startup failed', error.message))
  setInterval(() => { void run().catch((error) => console.error('[backup] scheduler failed', error.message)) }, 60 * 60 * 1000).unref()
}
