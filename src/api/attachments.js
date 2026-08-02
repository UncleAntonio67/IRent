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

function readLocalFileBase64(filePath) {
  return new Promise((resolve, reject) => {
    const fs = getFileSystemManagerSafe()
    if (!fs) {
      reject(new Error('FILE_SYSTEM_UNAVAILABLE'))
      return
    }
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve(String(res.data || '')),
      fail: reject,
    })
  })
}

export async function uploadAttachmentForRoom({ roomId, type, file }) {
  const attachmentType = toAttachmentType(type)
  const contentBase64 = await readLocalFileBase64(file.filePath || file.url || '')
  const localUpload = await apiRequest('/attachments/local-upload', {
    method: 'POST',
    data: {
      type: attachmentType,
      fileName: file.name || 'image.jpg',
      mimeType: file.mimeType || 'image/jpeg',
      fileSize: Number(file.size || 1) || 1,
      contentBase64,
    },
    timeout: 60000,
  })

  const confirmed = await apiRequest('/attachments/confirm', {
    method: 'POST',
    data: {
      type: attachmentType,
      fileName: file.name || 'image.jpg',
      mimeType: file.mimeType || 'image/jpeg',
      fileSize: Number(file.size || 1) || 1,
      storageKey: localUpload.storageKey,
      roomId,
    },
  })

  return mapServerAttachmentFile(confirmed.attachment || null)
}

export async function deleteAttachmentForRoom(attachmentId) {
  if (!attachmentId) return
  await apiRequest(`/attachments/${attachmentId}`, { method: 'DELETE' })
}
