import { computed, ref } from 'vue'

const USERS_STORAGE_KEY = 'irent_users_v1'
const ACTIVE_USER_STORAGE_KEY = 'irent_active_user_v1'

function generateTenantId() {
  return `tenant_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

function loadUsers() {
  try {
    const stored = uni.getStorageSync(USERS_STORAGE_KEY)
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function loadActiveUserId() {
  try {
    return String(uni.getStorageSync(ACTIVE_USER_STORAGE_KEY) || '')
  } catch {
    return ''
  }
}

export const users = ref(loadUsers())
export const activeUserId = ref(loadActiveUserId())
export const currentUser = computed(() => users.value.find((item) => item.id === activeUserId.value) || null)
export const isLoggedIn = computed(() => Boolean(currentUser.value))

function persistUsers() {
  try {
    uni.setStorageSync(USERS_STORAGE_KEY, users.value)
  } catch {}
}

function persistActiveUser() {
  try {
    uni.setStorageSync(ACTIVE_USER_STORAGE_KEY, activeUserId.value)
  } catch {}
}

export function buildTenantStorageKey(baseKey) {
  const tenantId = activeUserId.value || 'guest'
  return `${baseKey}__${tenantId}`
}

export function createLocalTenant(profile = {}) {
  const user = {
    id: generateTenantId(),
    nickName: String(profile.nickName || '微信用户'),
    avatarUrl: String(profile.avatarUrl || ''),
    createdAt: new Date().toISOString(),
  }
  users.value = [user, ...users.value]
  activeUserId.value = user.id
  persistUsers()
  persistActiveUser()
  return user
}

export function switchTenant(userId) {
  const hit = users.value.find((item) => item.id === userId)
  if (!hit) return null
  activeUserId.value = hit.id
  persistActiveUser()
  return hit
}

export function logoutTenant() {
  activeUserId.value = ''
  persistActiveUser()
}

export function loginWithWeChatProfile() {
  return new Promise((resolve, reject) => {
    const getter = uni.getUserProfile || uni.getUserInfo
    if (!getter) {
      reject(new Error('当前环境不支持微信资料获取'))
      return
    }
    getter({
      desc: '用于建立当前用户的本地数据空间',
      success: (res) => {
        const profile = res.userInfo || {}
        resolve(createLocalTenant(profile))
      },
      fail: reject,
    })
  })
}
