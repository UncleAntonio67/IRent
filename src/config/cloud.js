const API_BASE_STORAGE_KEY = 'irent_cloud_api_base_v1'
const DEFAULT_CLOUD_API_BASE_URL = 'https://irent.antoniolq.top'
const LOCAL_ONLY_MODE = false

function getStoredCloudApiBaseUrl() {
  // Production uses one fixed, verified HTTPS endpoint. Earlier preview builds
  // stored a retired Cloud Run URL under this key; never let that stale value
  // redirect a current client away from the Tencent deployment.
  const officialBase = DEFAULT_CLOUD_API_BASE_URL
  try {
    const stored = String(uni.getStorageSync(API_BASE_STORAGE_KEY) || '').trim()
    if (stored && stored.replace(/\/+$/, '') !== officialBase) {
      uni.setStorageSync(API_BASE_STORAGE_KEY, officialBase)
    }
  } catch {}
  return officialBase
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
  const requested = String(nextUrl || '').trim().replace(/\/+$/, '')
  const normalized = requested === DEFAULT_CLOUD_API_BASE_URL ? requested : DEFAULT_CLOUD_API_BASE_URL
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
