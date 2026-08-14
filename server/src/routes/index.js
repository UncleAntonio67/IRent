import { authRouter } from './modules/auth.js'
import { attachmentRouter } from './modules/attachments.js'
import { exportRouter } from './modules/exports.js'
import { propertyRouter } from './modules/properties.js'
import { roomRouter } from './modules/rooms.js'
import { tenantRouter } from './modules/tenants.js'
import { devRouter } from './modules/dev.js'
import { backupRouter } from './modules/backups.js'

export function registerRoutes(app) {
  app.use('/api/auth', authRouter)
  app.use('/api/tenants', tenantRouter)
  app.use('/api/dev', devRouter)
  app.use('/api/properties', propertyRouter)
  app.use('/api/rooms', roomRouter)
  app.use('/api/attachments', attachmentRouter)
  app.use('/api/exports', exportRouter)
  app.use('/api/backups', backupRouter)
}
