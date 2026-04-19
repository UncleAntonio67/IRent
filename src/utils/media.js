function resolveTempPath(file) {
  return file?.tempFilePath || file?.path || file?.url || file?.filePath || ''
}

function resolveFileName(path, fallbackPrefix = 'image') {
  const normalizedPath = String(path || '')
  const rawName = normalizedPath.split('/').pop() || normalizedPath.split('\\').pop() || ''
  if (rawName) return rawName
  return `${fallbackPrefix}_${Date.now()}.jpg`
}

export function normalizeChosenImage(file, options = {}) {
  const path = resolveTempPath(file)
  const fallbackPrefix = options.fallbackPrefix || 'image'
  const now = options.uploadedAt || ''
  return {
    id: options.id || '',
    name: options.name || resolveFileName(path, fallbackPrefix),
    uploadedAt: now,
    source: 'local',
    previewText: options.previewText || '',
    filePath: path,
    url: path,
    size: Number(file?.size || 0) || 0,
    mimeType: file?.type || 'image/jpeg',
    remark: options.remark || '',
  }
}

export function chooseSingleImage(options = {}) {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      ...options,
      success(res) {
        const rawFile = Array.isArray(res.tempFiles) && res.tempFiles.length > 0
          ? res.tempFiles[0]
          : { tempFilePath: res.tempFilePaths?.[0] || '' }
        resolve(normalizeChosenImage(rawFile, options))
      },
      fail(err) {
        reject(err)
      },
    })
  })
}

export function hasPreviewableImage(file) {
  return Boolean(resolveTempPath(file))
}

export function previewChosenImage(file) {
  const current = resolveTempPath(file)
  if (!current) return false
  uni.previewImage({
    current,
    urls: [current],
  })
  return true
}
