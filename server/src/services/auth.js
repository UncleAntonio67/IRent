import { prisma } from '../db.js'
import { signAccessToken } from '../lib/jwt.js'
import { exchangeWeChatCode } from './wechat.js'

function sanitizeUser(user) {
  return {
    id: user.id,
    nickName: user.nickName,
    avatarUrl: user.avatarUrl,
    activeTenantId: user.activeTenantId || null,
  }
}

function sanitizeTenant(tenant) {
  if (!tenant) return null
  return {
    id: tenant.id,
    name: tenant.name,
  }
}

export async function loginWithWeChat({ code, nickName, avatarUrl }) {
  const session = await exchangeWeChatCode(code)

  let user = await prisma.user.upsert({
    where: { wechatOpenId: session.openid },
    create: {
      wechatOpenId: session.openid,
      unionId: session.unionid || null,
      nickName: nickName || '微信用户',
      avatarUrl: avatarUrl || null,
    },
    update: {
      unionId: session.unionid || null,
      nickName: nickName || undefined,
      avatarUrl: avatarUrl || undefined,
    },
    include: {
      activeTenant: true,
      tenantMemberships: {
        include: { tenant: true },
      },
    },
  })

  if (user.tenantMemberships.length === 0) {
    const tenant = await prisma.tenant.create({
      data: {
        name: `${user.nickName}的空间`,
        users: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    })

    user = await prisma.user.update({
      where: { id: user.id },
      data: { activeTenantId: tenant.id },
      include: {
        activeTenant: true,
        tenantMemberships: {
          include: { tenant: true },
        },
      },
    })
  } else if (!user.activeTenantId) {
    const fallbackTenantId = user.tenantMemberships[0].tenantId
    user = await prisma.user.update({
      where: { id: user.id },
      data: { activeTenantId: fallbackTenantId },
      include: {
        activeTenant: true,
        tenantMemberships: {
          include: { tenant: true },
        },
      },
    })
  }

  const token = signAccessToken({
    sub: user.id,
    tenantId: user.activeTenantId,
  })

  return {
    token,
    user: sanitizeUser(user),
    tenant: sanitizeTenant(user.activeTenant),
    memberships: user.tenantMemberships.map((membership) => ({
      tenant: sanitizeTenant(membership.tenant),
      role: membership.role,
    })),
  }
}

export async function loginWithPublicAccount({ ipAddress, userAgent, deviceInfo }) {
  const publicOpenId = 'public:admin'
  let user = await prisma.user.upsert({
    where: { wechatOpenId: publicOpenId },
    create: {
      wechatOpenId: publicOpenId,
      nickName: 'admin',
    },
    update: {
      nickName: 'admin',
    },
    include: {
      activeTenant: true,
      tenantMemberships: { include: { tenant: true } },
    },
  })

  if (user.tenantMemberships.length === 0) {
    const tenant = await prisma.tenant.create({
      data: {
        name: '公共账户',
        users: { create: { userId: user.id, role: 'OWNER' } },
      },
    })
    user = await prisma.user.update({
      where: { id: user.id },
      data: { activeTenantId: tenant.id },
      include: {
        activeTenant: true,
        tenantMemberships: { include: { tenant: true } },
      },
    })
  } else if (!user.activeTenantId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { activeTenantId: user.tenantMemberships[0].tenantId },
      include: {
        activeTenant: true,
        tenantMemberships: { include: { tenant: true } },
      },
    })
  }

  await prisma.loginAudit.create({
    data: {
      userId: user.id,
      username: 'admin',
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      deviceInfo: deviceInfo || null,
    },
  })

  return {
    token: signAccessToken({ sub: user.id, tenantId: user.activeTenantId }),
    user: sanitizeUser(user),
    tenant: sanitizeTenant(user.activeTenant),
    memberships: user.tenantMemberships.map((membership) => ({
      tenant: sanitizeTenant(membership.tenant),
      role: membership.role,
    })),
  }
}

export function buildAuthMePayload(auth) {
  return {
    user: sanitizeUser(auth.user),
    tenant: sanitizeTenant(auth.tenant),
    memberships: auth.memberships.map((membership) => ({
      tenant: sanitizeTenant(membership.tenant),
      role: membership.role,
    })),
  }
}
