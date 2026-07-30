import express from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth.js'
import { createTenantForUser, switchTenantForUser } from '../../services/tenant.js'

export const tenantRouter = express.Router()

tenantRouter.use(requireAuth)

const createTenantSchema = z.object({
  name: z.string().trim().min(1).max(50),
})

const switchTenantSchema = z.object({
  tenantId: z.string().trim().min(1),
})

tenantRouter.get('/current', (req, res) => {
  res.json({
    ok: true,
    tenant: req.auth.tenant
      ? {
          id: req.auth.tenant.id,
          name: req.auth.tenant.name,
        }
      : null,
    memberships: req.auth.memberships.map((membership) => ({
      tenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
      },
      role: membership.role,
    })),
  })
})

tenantRouter.post('/', async (req, res, next) => {
  const parsed = createTenantSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, code: 'INVALID_PAYLOAD', message: 'Invalid tenant payload' })
    return
  }

  try {
    const tenant = await createTenantForUser(req.auth.user.id, parsed.data.name)
    res.json({
      ok: true,
      tenant,
    })
  } catch (error) {
    next(error)
  }
})

tenantRouter.post('/switch', async (req, res, next) => {
  const parsed = switchTenantSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, code: 'INVALID_PAYLOAD', message: 'Invalid switch payload' })
    return
  }

  try {
    const tenant = await switchTenantForUser(req.auth.user.id, parsed.data.tenantId)
    res.json({
      ok: true,
      tenant,
    })
  } catch (error) {
    next(error)
  }
})
