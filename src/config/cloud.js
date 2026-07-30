const API_BASE_STORAGE_KEY = 'irent_cloud_api_base_v1'
// The current delivery is a standalone local application. Keep cloud adapters
// in the codebase for a later deployment, but never expose them to runtime.
const LOCAL_ONLY_MODE = true

function getStoredCloudApiBaseUrl() {
  try {
    const stored = String(uni.getStorageSync(API_BASE_STORAGE_KEY) || '').trim()
    if (stored) return stored.replace(/\/+$/, '')
  } catch {}

  try {
    const envBase = String(import.meta.env.VITE_API_BASE_URL || '').trim()
    if (envBase) return envBase.replace(/\/+$/, '')
  } catch {}

  return ''
}

export function getCloudApiBaseUrl() {
  if (LOCAL_ONLY_MODE) return ''
  return getStoredCloudApiBaseUrl()
}

export function isCloudApiConfigured() {
  if (LOCAL_ONLY_MODE) return false
  return Boolean(getStoredCloudApiBaseUrl())
}

export function canUseCloudBackup() {
  if (LOCAL_ONLY_MODE) return false
  return Boolean(getStoredCloudApiBaseUrl())
}

export function isCloudBackupAccessEnabled() {
  if (LOCAL_ONLY_MODE) return false
  return Boolean(getStoredCloudApiBaseUrl())
}

export async function withCloudBackupAccess(task) {
  if (typeof task !== 'function') return null
  return task()
}

export function hasCloudApiBaseUrl() {
  if (LOCAL_ONLY_MODE) return false
  return Boolean(getStoredCloudApiBaseUrl())
}

export function setCloudApiBaseUrl(nextUrl) {
  const normalized = String(nextUrl || '').trim().replace(/\/+$/, '')
  try {
    uni.setStorageSync(API_BASE_STORAGE_KEY, normalized)
  } catch {}
  return normalized
}

// Kept as a compatibility export for older imports. Requests are no longer
// intercepted: configured deployments use the server as the primary replica.
export function installCloudRequestGuard() {
  return false
}
