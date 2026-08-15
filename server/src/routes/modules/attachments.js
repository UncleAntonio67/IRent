import express from 'express'
import multer from 'multer'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth.js'
import { requireTenant, requireTenantRole } from '../../lib/tenant.js'
import { confirmAttachmentUpload, deleteAttachment, presignAttachmentUpload } from '../../services/attachments.js'
import { saveLocalAttachment } from '../../services/r2.js'

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
  clientOperationId: z.string().trim().min(8).max(120).optional(),
})

const localUploadSchema = presignSchema.extend({
  contentBase64: z.string().min(1).max(28 * 1024 * 1024),
})

export const attachmentRouter = express.Router()
const binaryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024, files: 1 } })

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

attachmentRouter.post('/local-upload', async (req, res, next) => {
  const parsed = localUploadSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, code: 'INVALID_PAYLOAD', message: 'Invalid local attachment payload' })
    return
  }
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const { contentBase64, ...file } = parsed.data
    const uploaded = await saveLocalAttachment({ tenantId: tenant.id, ...file, base64: contentBase64 })
    res.json({ ok: true, ...uploaded })
  } catch (error) {
    next(error)
  }
})

// Streams the native temporary file without the Base64/JSON expansion used by
// the compatibility endpoint above.
attachmentRouter.post('/local-upload-binary', binaryUpload.single('file'), async (req, res, next) => {
  const parsed = presignSchema.safeParse({
    type: req.body?.type,
    fileName: req.body?.fileName || req.file?.originalname || 'attachment',
    mimeType: req.body?.mimeType || req.file?.mimetype || 'application/octet-stream',
    fileSize: Number(req.file?.size || 0),
  })
  if (!parsed.success || !req.file?.buffer?.length) {
    res.status(400).json({ ok: false, code: 'INVALID_ATTACHMENT_FILE', message: 'Invalid attachment file' })
    return
  }
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const uploaded = await saveLocalAttachment({ tenantId: tenant.id, ...parsed.data, buffer: req.file.buffer })
    res.json({ ok: true, ...uploaded })
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

attachmentRouter.delete('/:id', async (req, res, next) => {
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const result = await deleteAttachment({ tenantId: tenant.id, attachmentId: req.params.id })
    res.json({ ok: true, ...result })
  } catch (error) {
    next(error)
  }
})
