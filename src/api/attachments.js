import { apiRequest, uploadCloudFile } from './client'
import { mapServerAttachmentFile } from './mappers'
import { fetchRoomDetail } from './rooms'

function toAttachmentType(type) {
  if (type === 'idCard') return 'ID_CARD'
  if (type === 'contract') return 'CONTRACT'
  if (type === 'roomPhoto') return 'ROOM_PHOTO'
  if (type === 'meterPhoto') return 'METER_PHOTO'
  return 'RECEIPT'
}

export async function uploadAttachmentForRoom({ roomId, type, file, clientOperationId = '' }) {
  const attachmentType = toAttachmentType(type)
  const operationId = clientOperationId
    || file?.clientOperationId
    || `attachment_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  // Keep the key on the mutable local file so the offline fallback retries
  // the exact same server operation after a timeout.
  if (file && !file.clientOperationId) file.clientOperationId = operationId
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
      clientOperationId: operationId,
    },
  })

  return mapServerAttachmentFile(confirmed.attachment || null)
}

export async function deleteAttachmentForRoom(attachmentId) {
  if (!attachmentId) return { deleted: false, notFound: true, attachmentId: '' }
  try {
    await apiRequest(`/attachments/${attachmentId}`, { method: 'DELETE' })
    return { deleted: true, notFound: false, attachmentId }
  } catch (error) {
    // Deletion is intentionally idempotent. If a previous attempt reached
    // the server but its client-side follow-up failed, the queued retry must
    // finish instead of waiting forever on an already-removed attachment.
    if (Number(error?.statusCode || 0) === 404) {
      return { deleted: false, notFound: true, attachmentId }
    }
    throw error
  }
}

function sameAttachmentName(left, right) {
  return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase()
}

/**
 * Older clients stored a generated `photo_*` id even after the upload had
 * been confirmed by the API.  Deleting such a thumbnail used to receive a
 * harmless 404, remove it locally, and leave the real cloud attachment on
 * every other device.  Resolve a stale id against the canonical room detail
 * before allowing the local UI to consider the deletion complete.
 */
function attachmentFilesFromDetail(detail, type) {
  if (type === 'roomPhoto') return Array.isArray(detail?.roomPhotos) ? detail.roomPhotos : []
  const files = detail?.attachmentFiles?.[type]
  return Array.isArray(files) ? files : (files ? [files] : [])
}

function sameUploadedTime(left, right) {
  const leftTime = Date.parse(String(left || '').replace(' ', 'T'))
  const rightTime = Date.parse(String(right || '').replace(' ', 'T'))
  return Number.isFinite(leftTime) && Number.isFinite(rightTime) && Math.abs(leftTime - rightTime) < 1500
}

/**
 * Delete a room attachment cloud-first.  The canonical detail lookup is
 * deliberately shared by room photos, ID cards and contracts: old local
 * snapshots used generated ids, while the API uses attachment ids.
 */
export async function deleteRoomAttachmentFromCloud(roomId, type, file) {
  const firstAttempt = await deleteAttachmentForRoom(file?.id)
  if (!firstAttempt.notFound) return firstAttempt

  const detail = await fetchRoomDetail(roomId)
  const cloudFiles = attachmentFilesFromDetail(detail, type)
  const operationId = String(file?.clientOperationId || '').trim()
  let candidates = operationId
    ? cloudFiles.filter((item) => String(item?.clientOperationId || '').trim() === operationId)
    : []
  if (!candidates.length) candidates = cloudFiles.filter((item) => sameAttachmentName(item?.name, file?.name))
  const localSize = Number(file?.size || 0) || 0
  if (localSize > 0) {
    const sizeMatched = candidates.filter((item) => Number(item?.size || 0) === localSize)
    if (sizeMatched.length) candidates = sizeMatched
  }
  if (candidates.length > 1 && file?.uploadedAt) {
    const timeMatched = candidates.filter((item) => sameUploadedTime(item?.uploadedAt, file.uploadedAt))
    if (timeMatched.length) candidates = timeMatched
  }

  if (candidates.length !== 1) {
    const error = new Error('ATTACHMENT_ID_OUTDATED')
    error.code = 'ATTACHMENT_ID_OUTDATED'
    error.roomDetail = detail
    throw error
  }

  const resolved = candidates[0]
  const result = await deleteAttachmentForRoom(resolved.id)
  if (result.notFound) {
    const error = new Error('ATTACHMENT_DELETE_NOT_CONFIRMED')
    error.code = 'ATTACHMENT_DELETE_NOT_CONFIRMED'
    error.roomDetail = detail
    throw error
  }
  return { ...result, attachmentId: resolved.id, roomDetail: detail }
}

export function deleteRoomPhotoFromCloud(roomId, photo) {
  return deleteRoomAttachmentFromCloud(roomId, 'roomPhoto', photo)
}
