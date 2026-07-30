import express from 'express'
import { z } from 'zod'
import { requireTenant, requireTenantRole } from '../../lib/tenant.js'
import { requireAuth } from '../../middleware/auth.js'
import { createExportTask, listExportTasks } from '../../services/exports.js'

const createSchema = z.object({
  scope: z.enum(['all', 'room']),
  roomId: z.string().trim().min(1).optional().nullable(),
})

export const exportRouter = express.Router()

exportRouter.use(requireAuth)

exportRouter.get('/', async (req, res, next) => {
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const tasks = await listExportTasks({
      tenantId: tenant.id,
      userId: req.auth.user.id,
    })
    res.json({
      ok: true,
      tasks,
    })
  } catch (error) {
    next(error)
  }
})

exportRouter.post('/', async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'Invalid export payload',
      issues: parsed.error.flatten(),
    })
    return
  }

  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const task = await createExportTask({
      tenantId: tenant.id,
      userId: req.auth.user.id,
      scope: parsed.data.scope,
      roomId: parsed.data.scope === 'room' ? parsed.data.roomId || null : null,
    })
    res.json({
      ok: true,
      task,
    })
  } catch (error) {
    next(error)
  }
})
