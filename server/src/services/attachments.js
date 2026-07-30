import { prisma } from '../db.js'
import { buildPublicFileUrl, createPresignedUpload } from './r2.js'

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
}) {
  await Promise.all([
    assertRoomBelongsToTenant(roomId, tenantId),
    assertCollectionBelongsToTenant(collectionId, tenantId),
    assertMeterReadingBelongsToTenant(meterReadingId, tenantId),
  ])

  const attachment = await prisma.attachment.create({
    data: {
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
    uploadedAt: attachment.uploadedAt.toISOString(),
  }
}
