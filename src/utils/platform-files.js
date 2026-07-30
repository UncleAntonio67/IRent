function getGlobalWx() {
  if (typeof wx !== 'undefined') return wx
  return null
}

export function getFileSystemManagerSafe() {
  if (typeof uni !== 'undefined' && typeof uni.getFileSystemManager === 'function') {
    return uni.getFileSystemManager()
  }
  const wxGlobal = getGlobalWx()
  if (wxGlobal && typeof wxGlobal.getFileSystemManager === 'function') {
    return wxGlobal.getFileSystemManager()
  }
  return null
}

export function getUserDataPathSafe() {
  if (typeof uni !== 'undefined' && uni.env && uni.env.USER_DATA_PATH) {
    return uni.env.USER_DATA_PATH
  }
  const wxGlobal = getGlobalWx()
  if (wxGlobal && wxGlobal.env && wxGlobal.env.USER_DATA_PATH) {
    return wxGlobal.env.USER_DATA_PATH
  }
  return ''
}
