import { getCloudApiBaseUrl, isCloudBackupAccessEnabled } from '../config/cloud'

const TOKEN_STORAGE_KEY = 'irent_cloud_token_v1'
const DEFAULT_REQUEST_TIMEOUT = 30000
const CLOUD_BACKOFF_MS = 2 * 60 * 1000
let autoAuthInFlight = null
let cloudBackoffUntil = 0

export function getAccessToken() {
  try {
    return String(uni.getStorageSync(TOKEN_STORAGE_KEY) || '')
  } catch {
    return ''
  }
}

export function setAccessToken(token) {
  try {
    if (token) uni.setStorageSync(TOKEN_STORAGE_KEY, token)
    else uni.removeStorageSync(TOKEN_STORAGE_KEY)
  } catch {}
}

export function clearAccessToken() {
  setAccessToken('')
}

function buildHeaders(extra = {}) {
  const token = getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function requestRaw(url, options = {}) {
  const maxAttempts = Math.max(1, Number(options.retries || 1))
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const requestResult = await uni.request({
      url,
      method: options.method || 'GET',
      data: options.data || undefined,
      header: options.header || {},
      timeout: options.timeout || DEFAULT_REQUEST_TIMEOUT,
    })

    const [requestError, response] = Array.isArray(requestResult) ? requestResult : [null, requestResult]
    if (!requestError) return response

    const error = new Error(requestError.errMsg || 'REQUEST_FAILED')
    error.code = 'REQUEST_FAILED'
    error.errMsg = String(requestError.errMsg || '')
    lastError = error

    const shouldRetry = attempt < maxAttempts && /timeout|timed out|request:fail/i.test(String(requestError.errMsg || ''))
    if (!shouldRetry) throw error
  }

  throw lastError || new Error('REQUEST_FAILED')
}

async function ensureDevCloudSession() {
  if (autoAuthInFlight) return autoAuthInFlight

  const baseUrl = getCloudApiBaseUrl()
  if (!baseUrl) return false

  autoAuthInFlight = (async () => {
    const response = await requestRaw(`${baseUrl}/api/auth/wechat/login`, {
      method: 'POST',
      data: { code: 'dev:local-user' },
      header: { 'Content-Type': 'application/json' },
      timeout: DEFAULT_REQUEST_TIMEOUT,
      retries: 2,
    })

    const statusCode = Number(response?.statusCode || 0)
    const data = response?.data || {}
    if (statusCode >= 200 && statusCode < 300 && data?.ok !== false && data?.token) {
      setAccessToken(data.token)
      return true
    }
    return false
  })()

  try {
    return await autoAuthInFlight
  } finally {
    autoAuthInFlight = null
  }
}

export async function apiRequest(path, options = {}) {
  const baseUrl = getCloudApiBaseUrl()
  if (!baseUrl) {
    const error = new Error('Cloud API base URL is not configured')
    error.code = 'CLOUD_API_NOT_CONFIGURED'
    throw error
  }

  if (!isCloudBackupAccessEnabled()) {
    const error = new Error('CLOUD_REQUEST_BLOCKED')
    error.code = 'CLOUD_REQUEST_BLOCKED'
    throw error
  }

  if (Date.now() < cloudBackoffUntil) {
    const error = new Error('CLOUD_BACKOFF_ACTIVE')
    error.code = 'CLOUD_BACKOFF_ACTIVE'
    throw error
  }

  const normalizedPath = path.startsWith('/api/')
    ? path
    : `/api${path.startsWith('/') ? path : `/${path}`}`

  if (!getAccessToken() && normalizedPath !== '/api/auth/wechat/login') {
    await ensureDevCloudSession()
  }

  let response
  try {
    response = await requestRaw(`${baseUrl}${normalizedPath}`, {
      method: options.method || 'GET',
      data: options.data || undefined,
      header: buildHeaders(options.headers || {}),
      timeout: options.timeout || DEFAULT_REQUEST_TIMEOUT,
      retries: options.retries || 2,
    })
  } catch (error) {
    if (/timeout|timed out|request:fail/i.test(String(error?.errMsg || error?.message || ''))) {
      cloudBackoffUntil = Date.now() + CLOUD_BACKOFF_MS
    }
    throw error
  }

  if (Number(response?.statusCode || 0) === 401 && normalizedPath !== '/api/auth/wechat/login') {
    const relogged = await ensureDevCloudSession()
    if (relogged) {
      try {
        response = await requestRaw(`${baseUrl}${normalizedPath}`, {
          method: options.method || 'GET',
          data: options.data || undefined,
          header: buildHeaders(options.headers || {}),
          timeout: options.timeout || DEFAULT_REQUEST_TIMEOUT,
          retries: options.retries || 2,
        })
      } catch (error) {
        if (/timeout|timed out|request:fail/i.test(String(error?.errMsg || error?.message || ''))) {
          cloudBackoffUntil = Date.now() + CLOUD_BACKOFF_MS
        }
        throw error
      }
    }
  }

  const statusCode = Number(response?.statusCode || 0)
  const data = response?.data || {}
  if (statusCode >= 200 && statusCode < 300 && data?.ok !== false) {
    cloudBackoffUntil = 0
    return data
  }

  const error = new Error(data?.message || `HTTP_${statusCode || 'ERROR'}`)
  error.code = data?.code || `HTTP_${statusCode || 'ERROR'}`
  error.statusCode = statusCode
  error.payload = data
  throw error
}
