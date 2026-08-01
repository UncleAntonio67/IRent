import { randomUUID } from 'node:crypto'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config } from '../config.js'

function buildR2Endpoint() {
  return `https://${config.r2.accountId}.r2.cloudflarestorage.com`
}

function assertR2Configured() {
  const required = [
    ['R2 account id', config.r2.accountId],
    ['R2 access key id', config.r2.accessKeyId],
    ['R2 secret access key', config.r2.secretAccessKey],
    ['R2 bucket', config.r2.bucket],
  ]
  const missing = required.filter(([, value]) => !value).map(([label]) => label)
  if (missing.length > 0) {
    const error = new Error(`Missing R2 config: ${missing.join(', ')}`)
    error.statusCode = 500
    error.code = 'R2_CONFIG_MISSING'
    throw error
  }
}

let clientSingleton = null

function getR2Client() {
  if (clientSingleton) return clientSingleton
  assertR2Configured()
  clientSingleton = new S3Client({
    region: 'auto',
    endpoint: buildR2Endpoint(),
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
  })
  return clientSingleton
}

function sanitizeExt(fileName = '') {
  const match = fileName.match(/(\.[a-zA-Z0-9_-]{1,12})$/)
  return match ? match[1].toLowerCase() : ''
}

function sanitizeSegment(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildStorageKey({ tenantId, type, fileName }) {
  const now = new Date()
  const year = String(now.getUTCFullYear())
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const ext = sanitizeExt(fileName)
  const safeType = sanitizeSegment(type).toLowerCase() || 'file'
  return `${tenantId}/${safeType}/${year}/${month}/${randomUUID()}${ext}`
}

export function buildPublicFileUrl(storageKey) {
  if (!config.r2.publicBaseUrl) return null
  return `${config.r2.publicBaseUrl.replace(/\/$/, '')}/${storageKey}`
}

export async function createPresignedUpload({
  tenantId,
  type,
  fileName,
  mimeType,
  fileSize,
}) {
  const storageKey = buildStorageKey({ tenantId, type, fileName })
  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: config.r2.bucket,
    Key: storageKey,
    ContentType: mimeType || 'application/octet-stream',
  })
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 10 })

  return {
    storageKey,
    uploadUrl,
    expiresIn: 60 * 10,
    method: 'PUT',
    headers: {
      'Content-Type': mimeType || 'application/octet-stream',
    },
    file: {
      fileName,
      mimeType: mimeType || null,
      fileSize: fileSize || 0,
      fileUrl: buildPublicFileUrl(storageKey),
    },
  }
}

export async function putObjectText({ storageKey, body, contentType = 'text/plain; charset=utf-8' }) {
  const client = getR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: config.r2.bucket,
      Key: storageKey,
      Body: body,
      ContentType: contentType,
    })
  )

  return {
    storageKey,
    fileUrl: buildPublicFileUrl(storageKey),
  }
}

export async function deleteStorageObject(storageKey) {
  if (!storageKey) return
  const client = getR2Client()
  await client.send(new DeleteObjectCommand({ Bucket: config.r2.bucket, Key: storageKey }))
}
