let navLock = false
let navTimer = null
let hardReleaseTimer = null
let lastNavAt = 0
let lastTargetUrl = ''

const MIN_NAV_INTERVAL = 400
const DEFAULT_RELEASE_DELAY = 700
const FAIL_RELEASE_DELAY = 300
const HARD_RELEASE_DELAY = 1800

function now() {
  return Date.now()
}

function releaseLock(delay = DEFAULT_RELEASE_DELAY) {
  if (navTimer) {
    clearTimeout(navTimer)
  }
  if (hardReleaseTimer) {
    clearTimeout(hardReleaseTimer)
    hardReleaseTimer = null
  }
  navTimer = setTimeout(() => {
    navLock = false
    navTimer = null
  }, delay)
}

function withLock(run) {
  const elapsed = now() - lastNavAt
  if (elapsed < MIN_NAV_INTERVAL) return
  if (navLock) return
  navLock = true
  lastNavAt = now()
  if (hardReleaseTimer) {
    clearTimeout(hardReleaseTimer)
  }
  hardReleaseTimer = setTimeout(() => {
    navLock = false
    hardReleaseTimer = null
  }, HARD_RELEASE_DELAY)
  try {
    run({
      success: () => releaseLock(),
      fail: () => releaseLock(FAIL_RELEASE_DELAY),
    })
  } catch (error) {
    releaseLock(FAIL_RELEASE_DELAY)
    throw error
  }
}

function normalizeUrl(url) {
  return String(url || '').replace(/^\//, '')
}

function isDuplicateTarget(url) {
  const normalized = normalizeUrl(url)
  if (!normalized) return true
  const current = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  const currentRoute = current.length ? current[current.length - 1].route : ''
  if (normalized === currentRoute) return true
  if (normalized === lastTargetUrl && now() - lastNavAt < DEFAULT_RELEASE_DELAY) return true
  return false
}

function markTarget(url) {
  lastTargetUrl = normalizeUrl(url)
}

export function safeNavigateTo(target) {
  const options = typeof target === 'string' ? { url: target } : { ...(target || {}) }
  const url = options.url || ''
  if (isDuplicateTarget(url)) return
  markTarget(url)
  withLock((hooks) => {
    uni.navigateTo({
      ...options,
      url,
      success: hooks.success,
      fail: hooks.fail,
    })
  })
}

export function safeNavigateBack(options = {}) {
  const { delta = 1, fallbackUrl = '/pages/workbench/index', fallbackType = 'switchTab' } = options
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  if (pages.length > delta) {
    withLock((hooks) => {
      uni.navigateBack({
        delta,
        success: hooks.success,
        fail: hooks.fail,
      })
    })
    return
  }

  if (fallbackType === 'redirectTo') {
    safeRedirectTo(fallbackUrl)
    return
  }
  safeSwitchTab(fallbackUrl)
}

export function safeRedirectTo(url) {
  if (isDuplicateTarget(url)) return
  markTarget(url)
  withLock((hooks) => {
    uni.redirectTo({
      url,
      success: hooks.success,
      fail: hooks.fail,
    })
  })
}

export function safeSwitchTab(url) {
  if (isDuplicateTarget(url)) return
  markTarget(url)
  withLock((hooks) => {
    uni.switchTab({
      url,
      success: hooks.success,
      fail: hooks.fail,
    })
  })
}

export function resetNavigationLock() {
  navLock = false
  lastNavAt = 0
  lastTargetUrl = ''
  if (navTimer) {
    clearTimeout(navTimer)
    navTimer = null
  }
  if (hardReleaseTimer) {
    clearTimeout(hardReleaseTimer)
    hardReleaseTimer = null
  }
}
