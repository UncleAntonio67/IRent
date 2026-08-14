import { apiRequest } from './client'

export async function fetchCloudBackups() {
  const result = await apiRequest('/backups')
  return result.backups || []
}

export async function createCloudBackup() {
  const result = await apiRequest('/backups', { method: 'POST' })
  return result.backup || null
}

export async function restoreCloudBackup(id) {
  return apiRequest(`/backups/${encodeURIComponent(id)}/restore`, { method: 'POST', timeout: 60000, retries: 1 })
}
