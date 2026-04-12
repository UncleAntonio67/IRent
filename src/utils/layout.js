function callIfExists(target, method) {
  if (!target || typeof target[method] !== 'function') return null
  try {
    return target[method]()
  } catch {
    return null
  }
}

function getWindowInfoSafe() {
  return callIfExists(typeof uni !== 'undefined' ? uni : null, 'getWindowInfo')
    || callIfExists(typeof wx !== 'undefined' ? wx : null, 'getWindowInfo')
}

function getDeviceInfoSafe() {
  return callIfExists(typeof wx !== 'undefined' ? wx : null, 'getDeviceInfo')
}

function getAppBaseInfoSafe() {
  return callIfExists(typeof wx !== 'undefined' ? wx : null, 'getAppBaseInfo')
}

function getSafeAreaInsets(info) {
  if (info?.safeAreaInsets) return info.safeAreaInsets
  if (info?.safeArea && info?.windowHeight) {
    const bottom = Math.max(0, Number(info.windowHeight) - Number(info.safeArea.bottom || 0))
    return { bottom }
  }
  return null
}

function getLayoutInfo() {
  const windowInfo = getWindowInfoSafe() || {}
  const deviceInfo = getDeviceInfoSafe() || {}
  const appBaseInfo = getAppBaseInfoSafe() || {}
  return {
    statusBarHeight: Number(windowInfo.statusBarHeight || appBaseInfo.statusBarHeight || 20),
    windowHeight: Number(windowInfo.windowHeight || 700),
    safeAreaInsets: getSafeAreaInsets(windowInfo),
    screenWidth: Number(deviceInfo.screenWidth || windowInfo.screenWidth || 0),
  }
}

export function getPageHeaderTopPadding(defaultValue = 44) {
  const info = getLayoutInfo()
  return Math.max(defaultValue, Number(info.statusBarHeight || 20) + 12)
}

export function getDrawerHeaderTopPadding(defaultValue = 44) {
  const info = getLayoutInfo()
  return Math.max(18, Math.min(defaultValue, Number(info.statusBarHeight || 20)))
}

export function getSafeAreaBottom(defaultValue = 0) {
  const info = getLayoutInfo()
  return Number(info.safeAreaInsets?.bottom || defaultValue)
}

export function getWindowHeight(defaultValue = 700) {
  const info = getLayoutInfo()
  return Number(info.windowHeight || defaultValue)
}
