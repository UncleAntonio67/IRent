import { prisma } from '../db.js'
import { readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { deleteStorageObject, usesR2Storage } from './r2.js'

function collectAttachmentStorageKeys(value, keys = new Set()) {
  if (!value || typeof value !== 'object') return keys
  if (Array.isArray(value)) {
    value.forEach((item) => collectAttachmentStorageKeys(item, keys))
    return keys
  }
  if (value.storageKey) keys.add(String(value.storageKey))
  Object.values(value).forEach((item) => collectAttachmentStorageKeys(item, keys))
  return keys
}

/**
 * Archived rooms are read-only for three months.  Do not remove their
 * database snapshot when an object deletion fails: retaining it makes the
 * next scheduled cleanup retry the exact same storage keys instead of
 * leaving an invisible orphan on disk.
 */
export async function purgeExpiredRoomArchives(tenantId = '') {
  const where = { expiresAt: { lte: new Date() } }
  if (tenantId) where.tenantId = tenantId
  const expired = await prisma.roomArchive.findMany({
    where,
    select: { id: true, snapshotJson: true },
  })
  if (!expired.length) return { deletedArchives: 0, pendingArchives: 0 }

  const removableIds = []
  for (const item of expired) {
    const keys = [...collectAttachmentStorageKeys(item.snapshotJson)]
    const results = await Promise.allSettled(keys.map((key) => deleteStorageObject(key)))
    if (results.every((result) => result.status === 'fulfilled')) removableIds.push(item.id)
  }
  if (removableIds.length) await prisma.roomArchive.deleteMany({ where: { id: { in: removableIds } } })
  return { deletedArchives: removableIds.length, pendingArchives: expired.length - removableIds.length }
}

async function listFiles(root, current = root) {
  let entries = []
  try { entries = await readdir(current, { withFileTypes: true }) } catch { return [] }
  const files = []
  for (const entry of entries) {
    const target = path.join(current, entry.name)
    if (entry.isDirectory()) files.push(...await listFiles(root, target))
    else if (entry.isFile()) files.push({ path: target, key: path.relative(root, target).split(path.sep).join('/') })
  }
  return files
}

/**
 * Local binary uploads are written before the Attachment row is confirmed.
 * Reclaim only files that are not referenced by a live attachment or an
 * unexpired room archive, and only after a grace period so offline retries
 * still have a safe window to finish.
 */
export async function purgeOrphanedLocalUploads(tenantId) {
  if (!tenantId || usesR2Storage()) return { deletedFiles: 0 }
  const root = path.resolve(config.uploads.directory, String(tenantId))
  const [attachments, archives] = await Promise.all([
    prisma.attachment.findMany({ where: { tenantId }, select: { storageKey: true } }),
    prisma.roomArchive.findMany({ where: { tenantId, expiresAt: { gt: new Date() } }, select: { snapshotJson: true } }),
  ])
  const referenced = new Set(attachments.map((item) => String(item.storageKey || '')).filter(Boolean))
  archives.forEach((archive) => collectAttachmentStorageKeys(archive.snapshotJson, referenced))
  const cutoff = Date.now() - config.uploads.orphanRetentionHours * 60 * 60 * 1000
  let deletedFiles = 0
  for (const file of await listFiles(root)) {
    const storageKey = `${tenantId}/${file.key}`
    if (referenced.has(storageKey)) continue
    try {
      const details = await stat(file.path)
      if (details.mtimeMs > cutoff) continue
      await rm(file.path, { force: true })
      deletedFiles += 1
    } catch {
      // A concurrent upload/delete can win the race; the next daily pass
      // will safely evaluate the file again.
    }
  }
  return { deletedFiles }
}
