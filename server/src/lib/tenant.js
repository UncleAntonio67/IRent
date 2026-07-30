export function requireTenant(auth) {
  if (auth?.tenant?.id) {
    return auth.tenant
  }

  const error = new Error('Active tenant is required')
  error.statusCode = 400
  error.code = 'TENANT_REQUIRED'
  throw error
}

export function getActiveMembership(auth) {
  const tenant = requireTenant(auth)
  const membership = (auth?.memberships || []).find((item) => item.tenant?.id === tenant.id) || null
  if (!membership) {
    const error = new Error('Active tenant membership is required')
    error.statusCode = 403
    error.code = 'TENANT_MEMBERSHIP_REQUIRED'
    throw error
  }
  return membership
}

export function requireTenantRole(auth, allowedRoles = []) {
  const membership = getActiveMembership(auth)
  if (allowedRoles.includes(membership.role)) {
    return membership
  }

  const error = new Error('Insufficient tenant role')
  error.statusCode = 403
  error.code = 'TENANT_ROLE_FORBIDDEN'
  throw error
}
