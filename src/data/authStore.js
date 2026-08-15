import { computed, ref } from 'vue'
import { fetchCurrentSession, loginWithWeChatCode, clearCloudSession, recordPublicAccountLogin, recordWeChatAccountLogin } from '../api/auth'
import { apiRequest } from '../api/client'
import { hasCloudApiBaseUrl } from '../config/cloud'

const USERS_STORAGE_KEY = 'irent_users_v1'
const ACTIVE_USER_STORAGE_KEY = 'irent_active_user_v1'
const PROFILE_STORAGE_KEY = 'irent_profile_v1'
const CLOUD_SESSION_SNAPSHOT_KEY = 'irent_cloud_session_snapshot_v1'
const PUBLIC_ACCOUNT = Object.freeze({
  username: 'admin',
  password: '1qaz2wsx',
  id: 'public_admin',
  avatarUrl: '',
})

function generateTenantId() {
  return `tenant_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

function loadStoredValue(key, fallback) {
  try {
    const stored = uni.getStorageSync(key)
    return stored === '' || stored === undefined || stored === null ? fallback : stored
  } catch {
    return fallback
  }
}

function persistValue(key, value) {
  try {
    if (value === '' || value === null || value === undefined) {
      uni.removeStorageSync(key)
    } else {
      uni.setStorageSync(key, value)
    }
  } catch {}
}

function createPublicProfile() {
  return {
    id: PUBLIC_ACCOUNT.id,
    nickName: PUBLIC_ACCOUNT.username,
    avatarUrl: PUBLIC_ACCOUNT.avatarUrl,
    createdAt: new Date().toISOString(),
  }
}

// Restore the last authorized session immediately so an app relaunch does not
// briefly fall back to a guest storage namespace before silent WeChat login.
// Builds released before the snapshot key existed only stored these three
// individual records; keep supporting them so an offline launch never loses
// the owner's permission while an action is waiting to be uploaded.
function loadLocalSession() {
  const snapshot = loadStoredValue(CLOUD_SESSION_SNAPSHOT_KEY, null)
  const profile = snapshot?.profile || loadStoredValue(PROFILE_STORAGE_KEY, null)
  const storedUsers = Array.isArray(snapshot?.users)
    ? snapshot.users
    : loadStoredValue(USERS_STORAGE_KEY, [])
  const members = Array.isArray(storedUsers) ? storedUsers : []
  if (profile && members.length === 0) {
    members.push({ id: String(profile.id || PUBLIC_ACCOUNT.id), nickName: profile.nickName || PUBLIC_ACCOUNT.username, role: 'OWNER' })
  }
  return {
    profile,
    users: members,
    activeUserId: String(snapshot?.activeUserId || loadStoredValue(ACTIVE_USER_STORAGE_KEY, '') || members[0]?.id || ''),
  }
}

const initialSession = loadLocalSession()
export const users = ref(Array.isArray(initialSession?.users) ? initialSession.users : [])
export const activeUserId = ref(String(initialSession?.activeUserId || users.value[0]?.id || ''))
export const currentProfile = ref(initialSession?.profile || null)
export const currentUser = computed(() => currentProfile.value)
export const currentTenant = computed(() => users.value.find((item) => item.id === activeUserId.value) || users.value[0] || null)
export const isLoggedIn = computed(() => Boolean(currentProfile.value))
export const currentTenantRole = computed(() => String(currentTenant.value?.role || '').toUpperCase())
export const canManageTenantData = computed(() => isLoggedIn.value && ['OWNER', 'MANAGER'].includes(currentTenantRole.value))

function persistUsers() {
  persistValue(USERS_STORAGE_KEY, users.value)
}

function persistActiveUser() {
  persistValue(ACTIVE_USER_STORAGE_KEY, activeUserId.value)
}

function persistProfile() {
  persistValue(PROFILE_STORAGE_KEY, currentProfile.value)
}

function persistCloudSessionSnapshot() {
  persistValue(CLOUD_SESSION_SNAPSHOT_KEY, {
    profile: currentProfile.value,
    users: users.value,
    activeUserId: activeUserId.value,
    syncedAt: new Date().toISOString(),
  })
}

function clearLocalSession() {
  currentProfile.value = null
  users.value = []
  activeUserId.value = ''
  persistValue(PROFILE_STORAGE_KEY, null)
  persistValue(USERS_STORAGE_KEY, null)
  persistValue(ACTIVE_USER_STORAGE_KEY, null)
  persistValue(CLOUD_SESSION_SNAPSHOT_KEY, null)
}

function restoreCloudSessionSnapshot() {
  const snapshot = loadLocalSession()
  if (!snapshot.profile && snapshot.users.length === 0) return false
  currentProfile.value = snapshot.profile || null
  users.value = snapshot.users
  activeUserId.value = snapshot.activeUserId
  persistProfile()
  persistUsers()
  persistActiveUser()
  return Boolean(currentProfile.value || users.value.length)
}

export function buildTenantStorageKey(baseKey) {
  const tenantId = activeUserId.value || 'guest'
  return `${baseKey}__${tenantId}`
}

function applyCloudSession(result) {
  currentProfile.value = result?.user
    ? {
        id: result.user.id,
        nickName: result.user.nickName || '微信用户',
        avatarUrl: result.user.avatarUrl || '',
      }
    : null
  users.value = (result?.memberships || []).map((membership) => ({
    id: membership.tenant.id,
    nickName: membership.tenant.name,
    role: membership.role,
  }))
  activeUserId.value = result?.tenant?.id || users.value[0]?.id || ''
  persistProfile()
  persistUsers()
  persistActiveUser()
  persistCloudSessionSnapshot()
}

export function createLocalTenant(profile = {}) {
  const user = {
    id: generateTenantId(),
    nickName: String(profile.nickName || '微信用户'),
    avatarUrl: String(profile.avatarUrl || ''),
    createdAt: new Date().toISOString(),
  }
  currentProfile.value = user
  users.value = [{ id: user.id, nickName: user.nickName, role: 'OWNER' }]
  activeUserId.value = user.id
  persistProfile()
  persistUsers()
  persistActiveUser()
  persistCloudSessionSnapshot()
  return user
}

// This mini-program uses one shared local account. Credentials are kept here
// solely for the local login gate; the password is never persisted.
export function loginPublicAccount(credentials = {}) {
  const username = String(credentials.username || PUBLIC_ACCOUNT.username)
  const password = String(credentials.password || PUBLIC_ACCOUNT.password)
  if (username !== PUBLIC_ACCOUNT.username || password !== PUBLIC_ACCOUNT.password) {
    const error = new Error('账号或密码错误')
    error.code = 'INVALID_PUBLIC_CREDENTIALS'
    throw error
  }

  const user = {
    id: PUBLIC_ACCOUNT.id,
    nickName: PUBLIC_ACCOUNT.username,
    avatarUrl: PUBLIC_ACCOUNT.avatarUrl,
    createdAt: new Date().toISOString(),
  }
  currentProfile.value = user
  users.value = [{ id: user.id, nickName: user.nickName, role: 'OWNER' }]
  activeUserId.value = user.id
  persistProfile()
  persistUsers()
  persistActiveUser()
  persistCloudSessionSnapshot()
  return user
}

export async function initializePublicAccount() {
  if (!hasCloudApiBaseUrl()) return loginPublicAccount()
  try {
    const result = await recordWeChatAccountLogin()
    applyCloudSession(result)
    return currentProfile.value
  } catch (wechatError) {
    // Older local/dev deployments can still use the public fallback. A server
    // running AUTH_MODE=wechat rejects this fallback, leaving no local access.
    const errorCode = String(wechatError?.code || '')
    // A transient offline/TLS failure must never clear the locally persisted
    // shared session: its namespace owns the durable outbox of check-ins and
    // attachments waiting for upload.
    if (['REQUEST_FAILED', 'CLOUD_BACKOFF_ACTIVE'].includes(errorCode)) {
      if (!restoreCloudSessionSnapshot()) loginPublicAccount()
      return currentProfile.value
    }
    // Keep an existing shared session for every non-explicit login failure.
    // The application has no logout flow, and clearing it on a server 5xx or
    // temporary authentication outage would orphan the offline queue.
    if (!['WECHAT_CONFIG_MISSING', 'WECHAT_LOGIN_CODE_UNAVAILABLE'].includes(errorCode)) {
      if (!restoreCloudSessionSnapshot()) loginPublicAccount()
      return currentProfile.value
    }
    try {
      const result = await recordPublicAccountLogin()
      applyCloudSession(result)
      return currentProfile.value
    } catch {
      // An offline launch must remain operable: use the previous owner
      // session when present, otherwise initialise the app's shared local
      // administrator. The durable queue will migrate namespaces and upload
      // the business operation after connectivity is restored.
      if (!restoreCloudSessionSnapshot()) loginPublicAccount()
      return currentProfile.value
    }
  }
}

export async function restoreCloudSession() {
  if (!hasCloudApiBaseUrl()) return false
  restoreCloudSessionSnapshot()
  try {
    const result = await fetchCurrentSession()
    applyCloudSession(result)
    return true
  } catch {
    clearCloudSession()
    await initializePublicAccount()
    return Boolean(currentProfile.value)
  }
}

export async function switchTenant(userId) {
  const hit = users.value.find((item) => item.id === userId)
  if (!hit) return null
  if (hasCloudApiBaseUrl() && currentProfile.value) {
    const result = await apiRequest('/tenants/switch', {
      method: 'POST',
      data: { tenantId: userId },
    })
    activeUserId.value = result?.tenant?.id || userId
    persistActiveUser()
    persistCloudSessionSnapshot()
    return hit
  }
  activeUserId.value = hit.id
  persistActiveUser()
  persistCloudSessionSnapshot()
  return hit
}

export function logoutTenant() {
  // Compatibility for older callers: the shared account remains available.
  return loginPublicAccount()
}

export function loginWithWeChatProfile() {
  return new Promise((resolve, reject) => {
    const finishLogin = async (profile = {}) => {
      if (!hasCloudApiBaseUrl()) {
        resolve(createLocalTenant(profile))
        return
      }

      try {
        let code = 'dev:local-user'
        try {
          const loginResult = await uni.login({ provider: 'weixin' })
          const [, loginRes] = Array.isArray(loginResult) ? loginResult : [null, loginResult]
          code = String(loginRes?.code || code)
        } catch {}

        const result = await loginWithWeChatCode({
          code,
          nickName: profile.nickName || undefined,
          avatarUrl: profile.avatarUrl || undefined,
        })
        applyCloudSession(result)
        resolve(currentProfile.value)
      } catch (error) {
        reject(error)
      }
    }

    const getter = uni.getUserProfile || uni.getUserInfo
    if (!getter) {
      finishLogin({})
      return
    }

    getter({
      desc: '用于建立当前微信用户的租户空间',
      success: (res) => finishLogin(res.userInfo || {}),
      fail: (error) => {
        if (String(error?.errMsg || '').includes('cancel')) {
          reject(error)
          return
        }
        finishLogin({})
      },
    })
  })
}
