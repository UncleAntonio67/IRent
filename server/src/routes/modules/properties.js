import express from 'express'
import { prisma } from '../../db.js'
import { serializePropertyTree } from '../../lib/serializers.js'
import { requireTenant, requireTenantRole } from '../../lib/tenant.js'
import { requireAuth } from '../../middleware/auth.js'

export const propertyRouter = express.Router()

propertyRouter.use(requireAuth)

function toNullableString(value) {
  const next = String(value ?? '').trim()
  return next || null
}

function toNullableNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeRoomStatus(status) {
  const value = String(status || '').toUpperCase()
  if (value === 'RENTED') return 'RENTED'
  if (value === 'DUE_SOON') return 'DUE_SOON'
  if (value === 'OVERDUE') return 'OVERDUE'
  return 'EMPTY'
}

async function syncRoomTree(tx, tenantId, propertyItems) {
  const keepPropertyIds = []

  for (const [propertyIndex, propertyInput] of propertyItems.entries()) {
    const propertyId = String(propertyInput?.id || '')
    const propertyName = String(propertyInput?.name || '').trim()
    if (!propertyId || !propertyName) continue

    const property = await tx.property.upsert({
      where: { id: propertyId },
      update: { name: propertyName },
      create: {
        id: propertyId,
        tenantId,
        name: propertyName,
      },
    })
    keepPropertyIds.push(property.id)

    const keepBlockIds = []
    for (const [blockIndex, blockInput] of (propertyInput.blocks || []).entries()) {
      const blockId = String(blockInput?.id || '')
      const blockName = String(blockInput?.name || '').trim()
      if (!blockId || !blockName) continue

      const block = await tx.block.upsert({
        where: { id: blockId },
        update: {
          name: blockName,
          sortOrder: blockIndex,
          propertyId: property.id,
        },
        create: {
          id: blockId,
          propertyId: property.id,
          name: blockName,
          sortOrder: blockIndex,
        },
      })
      keepBlockIds.push(block.id)

      const keepFloorIds = []
      for (const [floorIndex, floorInput] of (blockInput.floors || []).entries()) {
        const floorId = String(floorInput?.id || `${block.id}_floor_${floorInput?.floor ?? floorIndex + 1}`)
        const floorNo = Number(floorInput?.floor || floorInput?.floorNo || 0)
        if (!floorId || !Number.isInteger(floorNo) || floorNo <= 0) continue

        const floor = await tx.floor.upsert({
          where: { id: floorId },
          update: {
            floorNo,
            sortOrder: floorIndex,
            blockId: block.id,
          },
          create: {
            id: floorId,
            blockId: block.id,
            floorNo,
            sortOrder: floorIndex,
          },
        })
        keepFloorIds.push(floor.id)

        const keepRoomIds = []
        for (const roomInput of floorInput.rooms || []) {
          const roomId = String(roomInput?.id || '')
          const roomNo = String(roomInput?.roomNo || '').trim()
          if (!roomId || !roomNo) continue

          const room = await tx.room.upsert({
            where: { id: roomId },
            update: {
              floorId: floor.id,
              roomNo,
              status: normalizeRoomStatus(roomInput.status),
              tenantName: toNullableString(roomInput.tenant),
              phone: toNullableString(roomInput.phone),
              idCardNo: toNullableString(roomInput.idCard),
              rentAmount: toNullableNumber(roomInput.rent),
              depositAmount: toNullableNumber(roomInput.deposit),
              paymentCycleMonths: toNullableNumber(roomInput.paymentCycle),
              leaseStartDate: roomInput.leaseStart ? new Date(roomInput.leaseStart) : null,
              leaseEndDate: roomInput.leaseEnd ? new Date(roomInput.leaseEnd) : null,
              waterPrice: toNullableNumber(roomInput.waterPrice),
              electricPrice: toNullableNumber(roomInput.electricPrice),
              gasPrice: toNullableNumber(roomInput.gasPrice),
              heatingPrice: toNullableNumber(roomInput.heatingPrice),
              waterChargeMode: toNullableString(roomInput.utilityChargeConfig?.water),
              electricChargeMode: toNullableString(roomInput.utilityChargeConfig?.electric),
              gasChargeMode: toNullableString(roomInput.utilityChargeConfig?.gas),
              heatingChargeMode: toNullableString(roomInput.utilityChargeConfig?.heating),
              lastWaterReading: toNullableNumber(roomInput.lastWater),
              lastElectricReading: toNullableNumber(roomInput.lastElectric),
              lastGasReading: toNullableNumber(roomInput.lastGas),
            },
            create: {
              id: roomId,
              floorId: floor.id,
              roomNo,
              status: normalizeRoomStatus(roomInput.status),
              tenantName: toNullableString(roomInput.tenant),
              phone: toNullableString(roomInput.phone),
              idCardNo: toNullableString(roomInput.idCard),
              rentAmount: toNullableNumber(roomInput.rent),
              depositAmount: toNullableNumber(roomInput.deposit),
              paymentCycleMonths: toNullableNumber(roomInput.paymentCycle),
              leaseStartDate: roomInput.leaseStart ? new Date(roomInput.leaseStart) : null,
              leaseEndDate: roomInput.leaseEnd ? new Date(roomInput.leaseEnd) : null,
              waterPrice: toNullableNumber(roomInput.waterPrice),
              electricPrice: toNullableNumber(roomInput.electricPrice),
              gasPrice: toNullableNumber(roomInput.gasPrice),
              heatingPrice: toNullableNumber(roomInput.heatingPrice),
              waterChargeMode: toNullableString(roomInput.utilityChargeConfig?.water),
              electricChargeMode: toNullableString(roomInput.utilityChargeConfig?.electric),
              gasChargeMode: toNullableString(roomInput.utilityChargeConfig?.gas),
              heatingChargeMode: toNullableString(roomInput.utilityChargeConfig?.heating),
              lastWaterReading: toNullableNumber(roomInput.lastWater),
              lastElectricReading: toNullableNumber(roomInput.lastElectric),
              lastGasReading: toNullableNumber(roomInput.lastGas),
            },
          })
          keepRoomIds.push(room.id)
        }

        await tx.room.deleteMany({
          where: {
            floorId: floor.id,
            ...(keepRoomIds.length ? { id: { notIn: keepRoomIds } } : {}),
          },
        })
      }

      await tx.floor.deleteMany({
        where: {
          blockId: block.id,
          ...(keepFloorIds.length ? { id: { notIn: keepFloorIds } } : {}),
        },
      })
    }

    await tx.block.deleteMany({
      where: {
        propertyId: property.id,
        ...(keepBlockIds.length ? { id: { notIn: keepBlockIds } } : {}),
      },
    })
  }

  await tx.property.deleteMany({
    where: {
      tenantId,
      ...(keepPropertyIds.length ? { id: { notIn: keepPropertyIds } } : {}),
    },
  })
}

propertyRouter.get('/', async (req, res, next) => {
  try {
    const tenant = requireTenant(req.auth)
    const properties = await prisma.property.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        blocks: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            floors: {
              orderBy: [{ sortOrder: 'asc' }, { floorNo: 'asc' }],
              include: {
                rooms: {
                  orderBy: [{ roomNo: 'asc' }],
                },
              },
            },
          },
        },
      },
    })

    res.json({
      ok: true,
      items: properties.map(serializePropertyTree),
    })
  } catch (error) {
    next(error)
  }
})

propertyRouter.post('/sync', async (req, res, next) => {
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const items = Array.isArray(req.body?.items) ? req.body.items : []

    await prisma.$transaction(async (tx) => {
      await syncRoomTree(tx, tenant.id, items)
    })

    const properties = await prisma.property.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        blocks: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            floors: {
              orderBy: [{ sortOrder: 'asc' }, { floorNo: 'asc' }],
              include: {
                rooms: {
                  orderBy: [{ roomNo: 'asc' }],
                },
              },
            },
          },
        },
      },
    })

    res.json({
      ok: true,
      items: properties.map(serializePropertyTree),
    })
  } catch (error) {
    next(error)
  }
})
