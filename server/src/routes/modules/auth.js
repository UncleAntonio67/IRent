import express from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth.js'
import { buildAuthMePayload, loginWithPublicAccount, loginWithWeChat } from '../../services/auth.js'

export const authRouter = express.Router()

const loginSchema = z.object({
  code: z.string().trim().min(1).optional(),
  nickName: z.string().trim().min(1).optional(),
  avatarUrl: z.string().trim().url().optional(),
})

authRouter.post('/wechat/login', async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, code: 'INVALID_PAYLOAD', message: 'Invalid login payload' })
    return
  }

  try {
    const result = await loginWithWeChat({
      ...parsed.data,
      code: parsed.data.code || 'dev:local-user',
    })
    res.json({
      ok: true,
      ...result,
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/public/login', async (req, res, next) => {
  const deviceInfo = typeof req.body?.deviceInfo === 'string' ? req.body.deviceInfo.slice(0, 2000) : null
  const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const ipAddress = forwardedFor || req.ip || req.socket?.remoteAddress || null

  try {
    const result = await loginWithPublicAccount({
      ipAddress,
      userAgent: String(req.get('user-agent') || '').slice(0, 1000),
      deviceInfo,
    })
    res.json({ ok: true, ...result })
  } catch (error) {
    next(error)
  }
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({
    ok: true,
    ...buildAuthMePayload(req.auth),
  })
})
