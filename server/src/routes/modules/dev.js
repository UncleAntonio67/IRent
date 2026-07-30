import express from 'express'
import { config } from '../../config.js'
import { requireTenant } from '../../lib/tenant.js'
import { requireAuth } from '../../middleware/auth.js'
import { seedTenantDemoData } from '../../services/dev-seed.js'

export const devRouter = express.Router()

devRouter.use(requireAuth)

devRouter.post('/seed', async (req, res, next) => {
  if (!config.devAuthBypass) {
    res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Not found' })
    return
  }

  try {
    const tenant = requireTenant(req.auth)
    const summary = await seedTenantDemoData({
      tenantId: tenant.id,
      userId: req.auth.user.id,
    })
    res.json({
      ok: true,
      summary,
    })
  } catch (error) {
    next(error)
  }
})
