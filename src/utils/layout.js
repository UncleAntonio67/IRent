function getSystemInfo() {
  if (typeof uni === 'undefined') return null

  if (typeof uni.getWindowInfo === 'function') {
    try {
      return uni.getWindowInfo()
    } catch {}
  }

  if (typeof uni.getSystemInfoSync === 'function') {
    try {
      return uni.getSystemInfoSync()
    } catch {}
  }

  return null
}

export function getPageHeaderTopPadding(defaultValue = 44) {
  const info = getSystemInfo()
  const statusBarHeight = Number(info?.statusBarHeight || 20)
  return Math.max(defaultValue, statusBarHeight + 12)
}

export function getDrawerHeaderTopPadding(defaultValue = 44) {
  const info = getSystemInfo()
  const statusBarHeight = Number(info?.statusBarHeight || 20)
  return Math.max(18, Math.min(defaultValue, statusBarHeight))
}

export function getSafeAreaBottom(defaultValue = 0) {
  const info = getSystemInfo()
  return Number(info?.safeAreaInsets?.bottom || defaultValue)
}

export function getWindowHeight(defaultValue = 700) {
  const info = getSystemInfo()
  return Number(info?.windowHeight || defaultValue)
}
