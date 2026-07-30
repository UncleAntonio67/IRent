import { prisma } from '../db.js'
import { verifyAccessToken } from '../lib/jwt.js'

function readBearerToken(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return ''
  return header.slice(7).trim()
}

export async function requireAuth(req, res, next) {
  try {
    const token = readBearerToken(req)
    if (!token) {
      res.status(401).json({ ok: false, code: 'UNAUTHORIZED', message: 'Missing bearer token' })
      return
    }

    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        activeTenant: true,
        tenantMemberships: {
          include: {
            tenant: true,
          },
        },
      },
    })

    if (!user) {
      res.status(401).json({ ok: false, code: 'UNAUTHORIZED', message: 'User not found' })
      return
    }

    req.auth = {
      tokenPayload: payload,
      user,
      tenant: user.activeTenant || null,
      memberships: user.tenantMemberships || [],
    }

    next()
  } catch (error) {
    res.status(401).json({
      ok: false,
      code: 'UNAUTHORIZED',
      message: error?.message || 'Invalid token',
    })
  }
}
