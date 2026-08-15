import { prisma } from '../db.js'
import { buildPublicFileUrl, createPresignedUpload, deleteStorageObject } from './r2.js'

async function assertRoomBelongsToTenant(roomId, tenantId) {
  if (!roomId) return null
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
      floor: {
        block: {
          property: {
            tenantId,
          },
        },
      },
    },
    select: { id: true },
  })
  if (!room) {
    const error = new Error('Room not found')
    error.statusCode = 404
    error.code = 'ROOM_NOT_FOUND'
    throw error
  }
  return room
}

async function assertCollectionBelongsToTenant(collectionId, tenantId) {
  if (!collectionId) return null
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      room: {
        floor: {
          block: {
            property: {
              tenantId,
            },
          },
        },
      },
    },
    select: { id: true },
  })
  if (!collection) {
    const error = new Error('Collection not found')
    error.statusCode = 404
    error.code = 'COLLECTION_NOT_FOUND'
    throw error
  }
  return collection
}

async function assertMeterReadingBelongsToTenant(meterReadingId, tenantId) {
  if (!meterReadingId) return null
  const reading = await prisma.meterReading.findFirst({
    where: {
      id: meterReadingId,
      room: {
        floor: {
          block: {
            property: {
              tenantId,
            },
          },
        },
      },
    },
    select: { id: true },
  })
  if (!reading) {
    const error = new Error('Meter reading not found')
    error.statusCode = 404
    error.code = 'METER_READING_NOT_FOUND'
    throw error
  }
  return reading
}

export async function presignAttachmentUpload({
  tenantId,
  type,
  fileName,
  mimeType,
  fileSize,
}) {
  return createPresignedUpload({
    tenantId,
    type,
    fileName,
    mimeType,
    fileSize,
  })
}

export async function confirmAttachmentUpload({
  tenantId,
  type,
  fileName,
  mimeType,
  fileSize,
  storageKey,
  roomId,
  collectionId,
  meterReadingId,
  clientOperationId = '',
}) {
  if (clientOperationId) {
    const existing = await prisma.attachment.findUnique({ where: { clientOperationId } })
    if (existing?.tenantId === tenantId) {
      return {
        id: existing.id,
        type: existing.type,
        fileName: existing.fileName,
        mimeType: existing.mimeType || null,
        filePath: existing.filePath || null,
        fileUrl: existing.fileUrl || null,
        storageKey: existing.storageKey || null,
        fileSize: existing.fileSize || 0,
        clientOperationId: existing.clientOperationId || null,
        uploadedAt: existing.uploadedAt.toISOString(),
      }
    }
  }
  await Promise.all([
    assertRoomBelongsToTenant(roomId, tenantId),
    assertCollectionBelongsToTenant(collectionId, tenantId),
    assertMeterReadingBelongsToTenant(meterReadingId, tenantId),
  ])

  const attachment = await prisma.attachment.create({
    data: {
      ...(clientOperationId ? { clientOperationId } : {}),
      tenantId,
      roomId: roomId || null,
      collectionId: collectionId || null,
      meterReadingId: meterReadingId || null,
      type,
      fileName,
      mimeType: mimeType || null,
      filePath: storageKey,
      fileUrl: buildPublicFileUrl(storageKey),
      storageKey,
      fileSize: fileSize || 0,
    },
  })

  return {
    id: attachment.id,
    type: attachment.type,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType || null,
    filePath: attachment.filePath || null,
    fileUrl: attachment.fileUrl || null,
    storageKey: attachment.storageKey || null,
    fileSize: attachment.fileSize || 0,
    clientOperationId: attachment.clientOperationId || null,
    uploadedAt: attachment.uploadedAt.toISOString(),
  }
}

export async function deleteAttachment({ tenantId, attachmentId }) {
  const attachment = await prisma.attachment.findFirst({ where: { id: attachmentId, tenantId } })
  if (!attachment) {
    const error = new Error('Attachment not found')
    error.statusCode = 404
    error.code = 'ATTACHMENT_NOT_FOUND'
    throw error
  }
  // Keep the attachment record when object-store deletion fails, so users can
  // retry instead of being left with an unmanageable orphaned upload.
  if (attachment.storageKey) await deleteStorageObject(attachment.storageKey)

  await prisma.$transaction(async (tx) => {
    await tx.attachment.delete({ where: { id: attachment.id } })
  })
  return { id: attachment.id, deleted: true }
}
