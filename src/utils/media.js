function resolveLocalPath(file) {
  return String(file?.tempFilePath || file?.path || file?.filePath || '')
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(String(value || ''))
}

function resolveTempPath(file) {
  const localPath = resolveLocalPath(file)
  if (localPath) return localPath
  const fallback = String(file?.url || '')
  return isRemoteUrl(fallback) ? '' : fallback
}

function resolveFileName(path, fallbackPrefix = 'image') {
  const normalizedPath = String(path || '')
  const rawName = normalizedPath.split('/').pop() || normalizedPath.split('\\').pop() || ''
  if (rawName) return rawName
  return `${fallbackPrefix}_${Date.now()}.jpg`
}

function resolveImageExtension(path) {
  const match = String(path || '').match(/\.(jpe?g|png|webp|pdf)$/i)
  return match ? `.${match[1].toLowerCase()}` : '.jpg'
}

function resolveDisplayName(fallbackPrefix, index, path) {
  const prefix = String(fallbackPrefix || 'image')
  const extension = resolveImageExtension(path)
  if (prefix === 'idCard') return `身份证图片${index + 1}${extension}`
  if (prefix === 'contract') return `租赁合同${index + 1}${extension}`
  if (prefix === 'receipt') return `收费凭证${extension}`

  const roomNo = prefix.replace(/_photo$/i, '')
  return `${roomNo || '房间'}_房屋照片${index + 1}${extension}`
}

// Keep an offline-friendly copy with a modest quality reduction. Some devices
// still return a large file for `sizeType: compressed`, so this is a second
// best-effort pass rather than a hard requirement for selecting an image.
function lightlyCompressImage(file) {
  const sourcePath = resolveLocalPath(file)
  if (!sourcePath || typeof uni.compressImage !== 'function') return Promise.resolve(file)

  return new Promise((resolve) => {
    uni.compressImage({
      src: sourcePath,
      quality: 80,
      success(result) {
        const compressedPath = String(result?.tempFilePath || sourcePath)
        resolve({
          ...file,
          tempFilePath: compressedPath,
          filePath: compressedPath,
          path: compressedPath,
        })
      },
      fail() {
        // Choosing an image must still succeed if the platform cannot compress it.
        resolve(file)
      },
    })
  })
}

// `chooseImage` returns a temporary path on mobile. That path can disappear
// after navigating away or after WeChat reclaims its cache, which used to make
// an offline check-in lose the selected photo before the queue could upload
// it. Persist the compressed copy first; browsers/devtools simply fall back to
// the original path when saveFile is unavailable.
function persistChosenImage(file) {
  const sourcePath = resolveLocalPath(file)
  if (!sourcePath || typeof uni.saveFile !== 'function') return Promise.resolve(file)
  return new Promise((resolve) => {
    uni.saveFile({
      tempFilePath: sourcePath,
      success(result) {
        const savedPath = String(result?.savedFilePath || sourcePath)
        resolve({ ...file, tempFilePath: savedPath, filePath: savedPath, path: savedPath })
      },
      fail() {
        resolve(file)
      },
    })
  })
}

export function normalizeChosenImage(file, options = {}, index = 0) {
  const path = resolveTempPath(file)
  const fallbackPrefix = options.fallbackPrefix || 'image'
  const now = options.uploadedAt || ''
  return {
    id: options.id || '',
    name: options.name || resolveDisplayName(fallbackPrefix, index, path) || resolveFileName(path, fallbackPrefix),
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

export function chooseImages(options = {}) {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: Math.max(1, Number(options.count || 1)),
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      ...options,
      async success(res) {
        const rawFiles = Array.isArray(res.tempFiles) && res.tempFiles.length > 0
          ? res.tempFiles
          : (res.tempFilePaths || []).map((tempFilePath) => ({ tempFilePath }))
        const compressedFiles = await Promise.all(rawFiles.map((file) => lightlyCompressImage(file)))
        const persistedFiles = await Promise.all(compressedFiles.map((file) => persistChosenImage(file)))
        resolve(persistedFiles.map((file, index) => normalizeChosenImage(file, options, index)).filter((file) => file.filePath))
      },
      fail(err) {
        reject(err)
      },
    })
  })
}

export async function chooseSingleImage(options = {}) {
  const files = await chooseImages({ ...options, count: 1 })
  return files[0] || null
}

export function hasPreviewableImage(file) {
  return Boolean(resolveTempPath(file))
}

export function resolveOfflineImageSrc(file) {
  return resolveTempPath(file)
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

export function previewChosenImages(files, currentIndex = 0) {
  const urls = (Array.isArray(files) ? files : [files])
    .map(resolveTempPath)
    .filter(Boolean)
  if (urls.length === 0) return false

  const index = Math.min(Math.max(Number(currentIndex) || 0, 0), urls.length - 1)
  uni.previewImage({ current: urls[index], urls })
  return true
}
