import express from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { requireTenant, requireTenantRole } from '../../lib/tenant.js'
import { clearBackups, createBackup, listBackups, restoreBackup } from '../../services/backups.js'

export const backupRouter = express.Router()
backupRouter.use(requireAuth)

backupRouter.get('/', async (req, res, next) => {
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    res.json({ ok: true, backups: await listBackups(tenant.id) })
  } catch (error) { next(error) }
})

backupRouter.post('/', async (req, res, next) => {
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    res.json({ ok: true, backup: await createBackup({ tenantId: tenant.id, reason: 'manual' }) })
  } catch (error) { next(error) }
})

backupRouter.delete('/', async (req, res, next) => {
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    res.json({ ok: true, ...(await clearBackups(tenant.id)) })
  } catch (error) { next(error) }
})

backupRouter.post('/:id/restore', async (req, res, next) => {
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    res.json({ ok: true, ...(await restoreBackup({ tenantId: tenant.id, backupId: req.params.id })) })
  } catch (error) { next(error) }
})
