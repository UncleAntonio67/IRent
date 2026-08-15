import { apiRequest, uploadCloudFile } from './client'
import { mapServerAttachmentFile } from './mappers'

function toAttachmentType(type) {
  if (type === 'idCard') return 'ID_CARD'
  if (type === 'contract') return 'CONTRACT'
  if (type === 'roomPhoto') return 'ROOM_PHOTO'
  if (type === 'meterPhoto') return 'METER_PHOTO'
  return 'RECEIPT'
}

export async function uploadAttachmentForRoom({ roomId, type, file }) {
  const attachmentType = toAttachmentType(type)
  const localUpload = await uploadCloudFile('/attachments/local-upload-binary', {
    filePath: file.filePath || file.url || '',
    formData: {
      type: attachmentType,
      fileName: file.name || 'image.jpg',
      mimeType: file.mimeType || 'image/jpeg',
    },
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
