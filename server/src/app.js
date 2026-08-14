import cors from 'cors'
import express from 'express'
import { mkdirSync } from 'node:fs'
import { config } from './config.js'
import { registerRoutes } from './routes/index.js'
import { startBackupScheduler } from './services/backups.js'

export function createApp() {
  const app = express()
  // The production service sits behind Nginx; this lets Express retain the
  // client address forwarded by that reverse proxy for login auditing.
  app.set('trust proxy', 1)

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin)) {
          callback(null, true)
          return
        }
        callback(new Error('Origin not allowed by CORS'))
      },
      credentials: true,
    })
  )
  // Base64 uploads need headroom over the original file size.
  app.use(express.json({ limit: '28mb' }))
  mkdirSync(config.uploads.directory, { recursive: true })
  app.use('/uploads', express.static(config.uploads.directory, { fallthrough: false, maxAge: '7d' }))

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'irent-server',
      env: config.nodeEnv,
      timestamp: new Date().toISOString(),
    })
  })

  registerRoutes(app)
  startBackupScheduler()

  app.use((req, res) => {
    res.status(404).json({
      ok: false,
      code: 'NOT_FOUND',
      message: `No route for ${req.method} ${req.path}`,
    })
  })

  app.use((err, _req, res, _next) => {
    const status = err.statusCode || 500
    res.status(status).json({
      ok: false,
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Unexpected server error',
    })
  })

  return app
}
