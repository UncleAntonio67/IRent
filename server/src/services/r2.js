import { randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
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

function hasR2Config() {
  return Boolean(config.r2.accountId && config.r2.accessKeyId && config.r2.secretAccessKey && config.r2.bucket)
}

export function usesR2Storage() {
  return hasR2Config()
}

function localPublicBaseUrl() {
  const configured = String(config.uploads.publicBaseUrl || '').replace(/\/$/, '')
  if (configured) return configured
  return `${String(config.appBaseUrl || '').replace(/\/$/, '')}/uploads`
}

function localPath(storageKey) {
  const root = path.resolve(config.uploads.directory)
  const target = path.resolve(root, storageKey)
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    const error = new Error('Invalid storage key')
    error.statusCode = 400
    error.code = 'INVALID_STORAGE_KEY'
    throw error
  }
  return target
}

async function putLocalObject(storageKey, body) {
  const target = localPath(storageKey)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, body)
  return { storageKey, fileUrl: `${localPublicBaseUrl()}/${storageKey}` }
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
  if (hasR2Config()) {
    if (!config.r2.publicBaseUrl) return null
    return `${config.r2.publicBaseUrl.replace(/\/$/, '')}/${storageKey}`
  }
  return `${localPublicBaseUrl()}/${storageKey}`
}

export async function createPresignedUpload({
  tenantId,
  type,
  fileName,
  mimeType,
  fileSize,
}) {
  if (!hasR2Config()) {
    const error = new Error('Local upload endpoint required')
    error.statusCode = 409
    error.code = 'LOCAL_UPLOAD_REQUIRED'
    throw error
  }
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

export async function saveLocalAttachment({ tenantId, type, fileName, base64, buffer }) {
  const storageKey = buildStorageKey({ tenantId, type, fileName })
  let body = Buffer.isBuffer(buffer) ? buffer : null
  if (!body) {
    const normalized = String(base64 || '').replace(/^data:[^;]+;base64,/, '')
    if (!normalized) {
      const error = new Error('Attachment content is required')
      error.statusCode = 400
      error.code = 'ATTACHMENT_CONTENT_REQUIRED'
      throw error
    }
    body = Buffer.from(normalized, 'base64')
  }
  if (!body.length) {
    const error = new Error('Attachment content is invalid')
    error.statusCode = 400
    error.code = 'ATTACHMENT_CONTENT_INVALID'
    throw error
  }
  return putLocalObject(storageKey, body)
}

export async function putObjectText({ storageKey, body, contentType = 'text/plain; charset=utf-8' }) {
  if (!hasR2Config()) return putLocalObject(storageKey, body)
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
  if (!hasR2Config()) {
    await rm(localPath(storageKey), { force: true })
    return
  }
  const client = getR2Client()
  await client.send(new DeleteObjectCommand({ Bucket: config.r2.bucket, Key: storageKey }))
}
