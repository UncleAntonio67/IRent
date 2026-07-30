import { prisma } from '../db.js'

function sanitizeTenant(tenant) {
  return {
    id: tenant.id,
    name: tenant.name,
  }
}

export async function createTenantForUser(userId, name) {
  const tenant = await prisma.tenant.create({
    data: {
      name,
      users: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { activeTenantId: tenant.id },
  })

  return sanitizeTenant(tenant)
}

export async function switchTenantForUser(userId, tenantId) {
  const membership = await prisma.tenantUser.findFirst({
    where: {
      userId,
      tenantId,
    },
    include: {
      tenant: true,
    },
  })

  if (!membership) {
    const error = new Error('Tenant membership not found')
    error.statusCode = 403
    error.code = 'TENANT_FORBIDDEN'
    throw error
  }

  await prisma.user.update({
    where: { id: userId },
    data: { activeTenantId: tenantId },
  })

  return sanitizeTenant(membership.tenant)
}
