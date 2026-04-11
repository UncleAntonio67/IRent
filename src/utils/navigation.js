let navLock = false
let navTimer = null
let lastNavAt = 0
let lastTargetUrl = ''

const MIN_NAV_INTERVAL = 250
const DEFAULT_RELEASE_DELAY = 450
const FAIL_RELEASE_DELAY = 250

function now() {
  return Date.now()
}

function releaseLock(delay = DEFAULT_RELEASE_DELAY) {
  if (navTimer) {
    clearTimeout(navTimer)
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
  try {
    run({
      complete: () => releaseLock(),
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
      complete: hooks.complete,
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
        complete: hooks.complete,
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
      complete: hooks.complete,
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
      complete: hooks.complete,
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
}
