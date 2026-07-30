import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { registerRoutes } from './routes/index.js'

export function createApp() {
  const app = express()

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
  app.use(express.json({ limit: '2mb' }))

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'irent-server',
      env: config.nodeEnv,
      timestamp: new Date().toISOString(),
    })
  })

  registerRoutes(app)

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
