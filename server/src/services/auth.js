import { prisma } from '../db.js'
import { signAccessToken } from '../lib/jwt.js'
import { config } from '../config.js'
import { exchangeWeChatCode } from './wechat.js'

function sanitizeUser(user) {
  return { id: user.id, nickName: user.nickName, avatarUrl: user.avatarUrl, activeTenantId: user.activeTenantId || null }
}

function sanitizeTenant(tenant) {
  return tenant ? { id: tenant.id, name: tenant.name } : null
}

function assertWeChatWhitelist(openid) {
  if (config.authMode !== 'wechat') return
  if (!config.wechatAllowedOpenIds.length) {
    const error = new Error('WeChat allowlist is not configured')
    error.statusCode = 503
    error.code = 'WECHAT_ALLOWLIST_NOT_CONFIGURED'
    throw error
  }
  if (!config.wechatAllowedOpenIds.includes(String(openid || ''))) {
    const error = new Error('This WeChat account is not authorized')
    error.statusCode = 403
    error.code = 'WECHAT_NOT_ALLOWED'
    throw error
  }
}

async function resolveSharedTenantId() {
  if (config.sharedTenantId) {
    const configured = await prisma.tenant.findUnique({ where: { id: config.sharedTenantId } })
    if (configured) return configured.id
  }
  const publicUser = await prisma.user.findUnique({
    where: { wechatOpenId: 'public:admin' },
    select: { activeTenantId: true },
  })
  return publicUser?.activeTenantId || null
}

async function loadUserWithTenant(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { activeTenant: true, tenantMemberships: { include: { tenant: true } } },
  })
}

function buildLoginPayload(user) {
  return {
    token: signAccessToken({ sub: user.id, tenantId: user.activeTenantId }),
    user: sanitizeUser(user),
    tenant: sanitizeTenant(user.activeTenant),
    memberships: user.tenantMemberships.map((membership) => ({ tenant: sanitizeTenant(membership.tenant), role: membership.role })),
  }
}

export async function loginWithWeChat({ code, nickName, avatarUrl, ipAddress, userAgent, deviceInfo }) {
  // Public-account compatibility mode does not require WeChat credentials.
  // Returning a normal shared session here prevents every app launch from
  // producing a misleading 500 before the client falls back to /public/login.
  if (config.authMode !== 'wechat' && (!config.wechatAppId || !config.wechatAppSecret)) {
    return loginWithPublicAccount({ ipAddress, userAgent, deviceInfo })
  }
  const session = await exchangeWeChatCode(code)
  assertWeChatWhitelist(session.openid)

  let user = await prisma.user.upsert({
    where: { wechatOpenId: session.openid },
    create: {
      wechatOpenId: session.openid,
      unionId: session.unionid || null,
      nickName: nickName || '\u5fae\u4fe1\u7528\u6237',
      avatarUrl: avatarUrl || null,
    },
    update: {
      unionId: session.unionid || null,
      nickName: nickName || undefined,
      avatarUrl: avatarUrl || undefined,
    },
    include: { activeTenant: true, tenantMemberships: { include: { tenant: true } } },
  })

  if (!user.tenantMemberships.length) {
    const sharedTenantId = await resolveSharedTenantId()
    const tenant = sharedTenantId
      ? await prisma.tenant.findUnique({ where: { id: sharedTenantId } })
      : await prisma.tenant.create({ data: { name: '\u5171\u4eab\u79df\u8d41\u7ba1\u7406' } })
    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: config.wechatOwnerOpenIds.includes(session.openid) ? 'OWNER' : 'MANAGER',
      },
    })
    user = await prisma.user.update({ where: { id: user.id }, data: { activeTenantId: tenant.id } })
    user = await loadUserWithTenant(user.id)
  } else if (!user.activeTenantId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { activeTenantId: user.tenantMemberships[0].tenantId } })
    user = await loadUserWithTenant(user.id)
  }

  await prisma.loginAudit.create({
    data: {
      userId: user.id,
      username: `wechat:${session.openid}`,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      deviceInfo: deviceInfo || null,
    },
  })
  return buildLoginPayload(user)
}

export async function loginWithPublicAccount({ ipAddress, userAgent, deviceInfo }) {
  if (config.authMode === 'wechat') {
    const error = new Error('WeChat login is required')
    error.statusCode = 403
    error.code = 'WECHAT_LOGIN_REQUIRED'
    throw error
  }
  const publicOpenId = 'public:admin'
  let user = await prisma.user.upsert({
    where: { wechatOpenId: publicOpenId },
    create: { wechatOpenId: publicOpenId, nickName: 'admin' },
    update: { nickName: 'admin' },
    include: { activeTenant: true, tenantMemberships: { include: { tenant: true } } },
  })

  if (!user.tenantMemberships.length) {
    const tenant = await prisma.tenant.create({ data: { name: '\u516c\u5171\u8d26\u6237', users: { create: { userId: user.id, role: 'OWNER' } } } })
    user = await prisma.user.update({ where: { id: user.id }, data: { activeTenantId: tenant.id } })
    user = await loadUserWithTenant(user.id)
  } else if (!user.activeTenantId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { activeTenantId: user.tenantMemberships[0].tenantId } })
    user = await loadUserWithTenant(user.id)
  }

  await prisma.loginAudit.create({
    data: { userId: user.id, username: 'admin', ipAddress: ipAddress || null, userAgent: userAgent || null, deviceInfo: deviceInfo || null },
  })
  return buildLoginPayload(user)
}

export function buildAuthMePayload(auth) {
  return {
    user: sanitizeUser(auth.user),
    tenant: sanitizeTenant(auth.tenant),
    memberships: auth.memberships.map((membership) => ({ tenant: sanitizeTenant(membership.tenant), role: membership.role })),
  }
}
