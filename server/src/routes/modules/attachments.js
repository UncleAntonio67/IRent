import express from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth.js'
import { requireTenant, requireTenantRole } from '../../lib/tenant.js'
import { confirmAttachmentUpload, presignAttachmentUpload } from '../../services/attachments.js'

const attachmentTypeSchema = z.enum([
  'ROOM_PHOTO',
  'ID_CARD',
  'CONTRACT',
  'RECEIPT',
  'METER_PHOTO',
  'TEMPLATE',
])

const presignSchema = z.object({
  type: attachmentTypeSchema,
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120).optional(),
  fileSize: z.number().int().min(1).max(20 * 1024 * 1024),
})

const confirmSchema = z.object({
  type: attachmentTypeSchema,
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120).optional(),
  fileSize: z.number().int().min(1).max(20 * 1024 * 1024),
  storageKey: z.string().trim().min(1),
  roomId: z.string().trim().min(1).optional(),
  collectionId: z.string().trim().min(1).optional(),
  meterReadingId: z.string().trim().min(1).optional(),
})

export const attachmentRouter = express.Router()

attachmentRouter.use(requireAuth)

attachmentRouter.post('/presign', async (req, res, next) => {
  const parsed = presignSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'Invalid attachment presign payload',
    })
    return
  }

  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const upload = await presignAttachmentUpload({
      tenantId: tenant.id,
      ...parsed.data,
    })
    res.json({
      ok: true,
      ...upload,
    })
  } catch (error) {
    next(error)
  }
})

attachmentRouter.post('/confirm', async (req, res, next) => {
  const parsed = confirmSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'Invalid attachment confirm payload',
    })
    return
  }

  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const attachment = await confirmAttachmentUpload({
      tenantId: tenant.id,
      ...parsed.data,
    })
    res.json({
      ok: true,
      attachment,
    })
  } catch (error) {
    next(error)
  }
})
