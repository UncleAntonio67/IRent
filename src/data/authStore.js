import { computed, ref } from 'vue'
import { fetchCurrentSession, loginWithWeChatCode, clearCloudSession, recordPublicAccountLogin } from '../api/auth'
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

// This is a shared internal mini-program. It always enters the common
// workspace directly; guest and logout states are intentionally unavailable.
export const users = ref([{ id: PUBLIC_ACCOUNT.id, nickName: PUBLIC_ACCOUNT.username, role: 'OWNER' }])
export const activeUserId = ref(PUBLIC_ACCOUNT.id)
export const currentProfile = ref(createPublicProfile())
export const currentUser = computed(() => currentProfile.value)
export const currentTenant = computed(() => users.value.find((item) => item.id === activeUserId.value) || users.value[0] || null)
export const isLoggedIn = computed(() => true)
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

function restoreCloudSessionSnapshot() {
  const snapshot = loadStoredValue(CLOUD_SESSION_SNAPSHOT_KEY, null)
  if (!snapshot || typeof snapshot !== 'object') return false
  currentProfile.value = snapshot.profile || null
  users.value = Array.isArray(snapshot.users) ? snapshot.users : []
  activeUserId.value = String(snapshot.activeUserId || users.value[0]?.id || '')
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
  const user = loginPublicAccount()
  try {
    await recordPublicAccountLogin()
  } catch {
    // Local-only development remains usable when the server is unavailable.
  }
  return user
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
    loginPublicAccount()
    return false
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
