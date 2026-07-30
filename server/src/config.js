import dotenv from 'dotenv'

dotenv.config()

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8080),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:8080',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  devAuthBypass: String(process.env.DEV_AUTH_BYPASS || '').toLowerCase() === 'true',
  wechatAppId: process.env.WECHAT_APPID || '',
  wechatAppSecret: process.env.WECHAT_APPSECRET || '',
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '',
  },
  allowedOrigins: String(process.env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
}

export function assertRequiredConfig() {
  const requiredKeys = ['databaseUrl', 'jwtSecret']
  const missing = requiredKeys.filter((key) => !config[key])
  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(', ')}`)
  }
}
