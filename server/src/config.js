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
  authMode: String(process.env.AUTH_MODE || 'public').trim().toLowerCase(),
  wechatAllowedOpenIds: String(process.env.WECHAT_ALLOWED_OPENIDS || '').split(',').map((item) => item.trim()).filter(Boolean),
  wechatOwnerOpenIds: String(process.env.WECHAT_OWNER_OPENIDS || '').split(',').map((item) => item.trim()).filter(Boolean),
  sharedTenantId: String(process.env.SHARED_TENANT_ID || '').trim(),
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '',
  },
  uploads: {
    // Local storage is the default for a self-hosted IRent deployment. Set
    // R2 credentials to opt into object storage instead.
    directory: process.env.UPLOAD_DIR || '/app/uploads',
    publicBaseUrl: process.env.UPLOAD_PUBLIC_BASE_URL || '',
    // A binary upload that never reaches /attachments/confirm has no database
    // record. Keep it briefly for a retried request, then reclaim it.
    orphanRetentionHours: Math.max(1, Number(process.env.UPLOAD_ORPHAN_RETENTION_HOURS || 24)),
  },
  backups: {
    // Daily tenant snapshots are kept locally with the Docker deployment.
    directory: process.env.BACKUP_DIR || '/app/backups',
    retentionDays: Math.max(1, Number(process.env.BACKUP_RETENTION_DAYS || 3)),
    // Cap each tenant's retained snapshots. The newest snapshot is always
    // retained so a temporary large attachment cannot remove all recovery data.
    maxBytes: Math.max(64, Number(process.env.BACKUP_MAX_SIZE_MB || 2048)) * 1024 * 1024,
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
