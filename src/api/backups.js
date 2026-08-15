import { apiRequest } from './client'
import { buildTenantStorageKey } from '../data/authStore.js'

const BACKUP_CACHE_KEY = 'cloud_backup_list_cache_v1'
const BACKUP_CACHE_MAX_AGE = 15 * 60 * 1000

function readBackupCache() {
  try {
    const value = uni.getStorageSync(buildTenantStorageKey(BACKUP_CACHE_KEY))
    return value && typeof value === 'object' ? value : { items: [], cachedAt: 0 }
  } catch { return { items: [], cachedAt: 0 } }
}

function writeBackupCache(items) {
  try { uni.setStorageSync(buildTenantStorageKey(BACKUP_CACHE_KEY), { items: items || [], cachedAt: Date.now() }) } catch {}
}

export function getCachedCloudBackups(maxAge = BACKUP_CACHE_MAX_AGE) {
  const cached = readBackupCache()
  return Date.now() - Number(cached.cachedAt || 0) <= maxAge ? (cached.items || []) : []
}

export async function fetchCloudBackups() {
  const result = await apiRequest('/backups')
  const backups = result.backups || []
  writeBackupCache(backups)
  return backups
}

export async function createCloudBackup() {
  const result = await apiRequest('/backups', { method: 'POST' })
  const backup = result.backup || null
  if (backup) writeBackupCache([backup, ...readBackupCache().items.filter((item) => item.id !== backup.id)])
  return backup
}

export async function clearCloudBackups() {
  const result = await apiRequest('/backups', { method: 'DELETE' })
  writeBackupCache([])
  return result
}

export async function restoreCloudBackup(id) {
  return apiRequest(`/backups/${encodeURIComponent(id)}/restore`, { method: 'POST', timeout: 60000, retries: 1 })
}
