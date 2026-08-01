import { apiRequest } from './client'
import { mapServerAttachmentFile } from './mappers'
import { getFileSystemManagerSafe } from '../utils/platform-files'

function toAttachmentType(type) {
  if (type === 'idCard') return 'ID_CARD'
  if (type === 'contract') return 'CONTRACT'
  if (type === 'roomPhoto') return 'ROOM_PHOTO'
  if (type === 'meterPhoto') return 'METER_PHOTO'
  return 'RECEIPT'
}

function readLocalFile(filePath) {
  return new Promise((resolve, reject) => {
    const fs = getFileSystemManagerSafe()
    if (!fs) {
      reject(new Error('FILE_SYSTEM_UNAVAILABLE'))
      return
    }
    fs.readFile({
      filePath,
      success: (res) => resolve(res.data),
      fail: reject,
    })
  })
}

function sendPresignedPut(uploadUrl, data, headers = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: uploadUrl,
      method: 'PUT',
      data,
      header: headers,
      success: (res) => {
        const statusCode = Number(res?.statusCode || 0)
        if (statusCode >= 200 && statusCode < 300) {
          resolve(res)
          return
        }
        reject(new Error(`UPLOAD_FAILED_${statusCode}`))
      },
      fail: reject,
    })
  })
}

export async function uploadAttachmentForRoom({ roomId, type, file }) {
  const attachmentType = toAttachmentType(type)
  const presigned = await apiRequest('/attachments/presign', {
    method: 'POST',
    data: {
      type: attachmentType,
      fileName: file.name || 'image.jpg',
      mimeType: file.mimeType || 'image/jpeg',
      fileSize: Number(file.size || 1) || 1,
    },
  })

  const binary = await readLocalFile(file.filePath || file.url || '')
  await sendPresignedPut(presigned.uploadUrl, binary, presigned.headers || {})

  const confirmed = await apiRequest('/attachments/confirm', {
    method: 'POST',
    data: {
      type: attachmentType,
      fileName: file.name || 'image.jpg',
      mimeType: file.mimeType || 'image/jpeg',
      fileSize: Number(file.size || 1) || 1,
      storageKey: presigned.storageKey,
      roomId,
    },
  })

  return mapServerAttachmentFile(confirmed.attachment || null)
}

export async function deleteAttachmentForRoom(attachmentId) {
  if (!attachmentId) return
  await apiRequest(`/attachments/${attachmentId}`, { method: 'DELETE' })
}
