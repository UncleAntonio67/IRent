import express from 'express'
import { prisma } from '../../db.js'
import { serializePropertyTree, serializeRoomDetail } from '../../lib/serializers.js'
import { roomDetailInclude } from '../../services/rooms.js'
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

function enumValue(value, allowed, fallback) {
  const normalized = String(value || '').toUpperCase()
  return allowed.includes(normalized) ? normalized : fallback
}

function dateOrNull(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function safeId(value, fallback) {
  const id = String(value || '').trim()
  return id || fallback
}

function serializeFullPropertyTree(property) {
  return {
    ...serializePropertyTree(property),
    blocks: (property.blocks || []).map((block) => ({
      id: block.id,
      name: block.name,
      sortOrder: block.sortOrder,
      floors: (block.floors || []).map((floor) => ({
        id: floor.id,
        floorNo: floor.floorNo,
        sortOrder: floor.sortOrder,
        rooms: (floor.rooms || []).map(serializeRoomDetail),
      })),
    })),
  }
}

async function readFullProperties(tenantId) {
  return prisma.property.findMany({
    where: { tenantId },
    orderBy: [{ createdAt: 'asc' }],
    include: {
      blocks: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          floors: {
            orderBy: [{ sortOrder: 'asc' }, { floorNo: 'asc' }],
            include: { rooms: { orderBy: [{ roomNo: 'asc' }], include: roomDetailInclude } },
          },
        },
      },
    },
  })
}

async function migrateLocalSnapshot(tx, tenantId, userId, propertyItems) {
  const existing = await tx.property.count({ where: { tenantId } })
  if (existing > 0) {
    const error = new Error('云端已存在房源，拒绝覆盖现有共享数据')
    error.statusCode = 409
    error.code = 'CLOUD_DATA_EXISTS'
    throw error
  }

  for (const [propertyIndex, propertyInput] of propertyItems.entries()) {
    const property = await tx.property.create({ data: {
      id: safeId(propertyInput?.id, `migration_property_${propertyIndex}`), tenantId,
      name: String(propertyInput?.name || '').trim() || `院落 ${propertyIndex + 1}`,
    } })
    for (const [blockIndex, blockInput] of (propertyInput?.blocks || []).entries()) {
      const block = await tx.block.create({ data: {
        id: safeId(blockInput?.id, `${property.id}_block_${blockIndex}`), propertyId: property.id,
        name: String(blockInput?.name || '').trim() || `楼栋 ${blockIndex + 1}`, sortOrder: blockIndex,
      } })
      for (const [floorIndex, floorInput] of (blockInput?.floors || []).entries()) {
        const floorNo = Number(floorInput?.floor || floorInput?.floorNo || floorIndex + 1) || floorIndex + 1
        const floor = await tx.floor.create({ data: {
          id: safeId(floorInput?.id, `${block.id}_floor_${floorNo}`), blockId: block.id, floorNo, sortOrder: floorIndex,
        } })
        for (const [roomIndex, roomInput] of (floorInput?.rooms || []).entries()) {
          const roomId = safeId(roomInput?.id, `${floor.id}_room_${roomIndex}`)
          const room = await tx.room.create({ data: {
            id: roomId, floorId: floor.id, roomNo: String(roomInput?.roomNo || roomIndex + 1),
            status: normalizeRoomStatus(roomInput?.status), tenantName: toNullableString(roomInput?.tenant),
            phone: toNullableString(roomInput?.phone), idCardNo: toNullableString(roomInput?.idCard),
            rentAmount: toNullableNumber(roomInput?.rent), depositAmount: toNullableNumber(roomInput?.deposit),
            paymentCycleMonths: Math.max(1, Math.trunc(Number(roomInput?.paymentCycle || 3) || 3)),
            leaseStartDate: dateOrNull(roomInput?.leaseStart), leaseEndDate: dateOrNull(roomInput?.leaseEnd),
            waterPrice: toNullableNumber(roomInput?.waterPrice), electricPrice: toNullableNumber(roomInput?.electricPrice),
            gasPrice: toNullableNumber(roomInput?.gasPrice), heatingPrice: toNullableNumber(roomInput?.heatingPrice),
            waterChargeMode: toNullableString(roomInput?.utilityChargeConfig?.water), electricChargeMode: toNullableString(roomInput?.utilityChargeConfig?.electric),
            gasChargeMode: toNullableString(roomInput?.utilityChargeConfig?.gas), heatingChargeMode: toNullableString(roomInput?.utilityChargeConfig?.heating),
            lastWaterReading: toNullableNumber(roomInput?.lastWater), lastElectricReading: toNullableNumber(roomInput?.lastElectric), lastGasReading: toNullableNumber(roomInput?.lastGas),
          } })
          const terms = Array.isArray(roomInput?.paymentSchedule) ? roomInput.paymentSchedule : []
          for (const [termIndex, item] of terms.entries()) {
            if (!dateOrNull(item?.startDate) || !dateOrNull(item?.endDate) || !dateOrNull(item?.dueDate || item?.startDate)) continue
            await tx.paymentTerm.create({ data: {
              id: safeId(item?.id, `${roomId}_term_${termIndex + 1}`), roomId, termNo: Math.max(1, Math.trunc(Number(item?.term || termIndex + 1))),
              startDate: dateOrNull(item.startDate), endDate: dateOrNull(item.endDate), dueDate: dateOrNull(item.dueDate || item.startDate),
              expectedAmount: Number(item?.expectedAmount || 0), paidAmount: Number(item?.paidAmount || 0), coveredAmount: Number(item?.coveredAmount ?? item?.paidAmount ?? 0),
              status: enumValue(item?.status, ['UNPAID', 'PAID', 'DUE_SOON', 'OVERDUE'], 'UNPAID'), paidAt: dateOrNull(item?.payDate),
            } })
          }
          const bills = Array.isArray(roomInput?.bills) ? roomInput.bills : []
          for (const [billIndex, item] of bills.entries()) await tx.bill.create({ data: {
            id: safeId(item?.id, `${roomId}_bill_${billIndex + 1}`), roomId,
            type: enumValue(item?.type, ['RENT', 'WATER', 'ELECTRIC', 'GAS', 'HEATING', 'CUSTOM', 'DEPOSIT'], 'CUSTOM'),
            title: String(item?.title || '费用'), amount: Number(item?.amount || 0),
            status: enumValue(item?.status, ['UNPAID', 'PAID', 'DUE_SOON', 'OVERDUE'], 'UNPAID'), dueDate: dateOrNull(item?.dueDate), paidAt: dateOrNull(item?.payDate),
          } })
          const collections = Array.isArray(roomInput?.collections) ? roomInput.collections : []
          for (const [collectionIndex, item] of collections.entries()) await tx.collection.create({ data: {
            id: safeId(item?.id, `${roomId}_collection_${collectionIndex + 1}`), roomId,
            billType: enumValue(item?.kind, ['RENT', 'WATER', 'ELECTRIC', 'GAS', 'HEATING', 'CUSTOM', 'DEPOSIT'], 'CUSTOM'),
            title: String(item?.title || '收款'), amount: Number(item?.amount || 0), note: toNullableString(item?.note), coverageLabel: toNullableString(item?.coverageLabel),
            paidAt: dateOrNull(item?.paidAt) || new Date(), relatedBillId: toNullableString(item?.billId), relatedTermId: Array.isArray(item?.termIds) ? toNullableString(item.termIds[0]) : null,
          } })
          for (const [readingIndex, item] of (Array.isArray(roomInput?.meterReadings) ? roomInput.meterReadings : []).entries()) await tx.meterReading.create({ data: {
            id: safeId(item?.id, `${roomId}_meter_${readingIndex + 1}`), roomId, waterReading: toNullableNumber(item?.waterRead), electricReading: toNullableNumber(item?.electricRead),
            gasReading: toNullableNumber(item?.gasRead), totalAmount: toNullableNumber(item?.total), recordedAt: dateOrNull(item?.date) || new Date(),
          } })
          for (const [occupancyIndex, item] of (Array.isArray(roomInput?.occupancies) ? roomInput.occupancies : []).entries()) await tx.occupancy.create({ data: {
            id: safeId(item?.id, `${roomId}_occupancy_${occupancyIndex + 1}`), roomId,
            kind: enumValue(item?.kind, ['LEASE', 'IDLE'], 'LEASE'), status: enumValue(item?.status, ['ACTIVE', 'COMPLETED', 'IDLE'], 'COMPLETED'),
            tenantName: toNullableString(item?.tenant), phone: toNullableString(item?.phone), idCardNo: toNullableString(item?.idCard), rentAmount: toNullableNumber(item?.rent), depositAmount: toNullableNumber(item?.deposit),
            paymentCycleMonths: Math.max(1, Math.trunc(Number(item?.paymentCycle || 3) || 3)), startDate: dateOrNull(item?.startDate), endDate: dateOrNull(item?.endDate), remark: toNullableString(item?.remark), archiveJson: item?.archive || null,
          } })
          for (const history of (Array.isArray(roomInput?.history) ? roomInput.history : [])) await tx.operationLog.create({ data: {
            tenantId, roomId, userId, action: String(history?.type || 'MIGRATED_OPERATION'), detail: String(history?.remark || ''), createdAt: dateOrNull(history?.date) || new Date(),
          } })
          await tx.operationLog.create({ data: { tenantId, roomId, userId, action: 'LOCAL_DATA_MIGRATED', detail: '本机历史数据已迁移至云端' } })
        }
      }
    }
  }
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

propertyRouter.get('/full-snapshot', async (req, res, next) => {
  try {
    const tenant = requireTenant(req.auth)
    const properties = await readFullProperties(tenant.id)
    res.json({ ok: true, items: properties.map(serializeFullPropertyTree) })
  } catch (error) { next(error) }
})

propertyRouter.post('/migrate-local', async (req, res, next) => {
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const items = Array.isArray(req.body?.items) ? req.body.items : []
    if (!items.length) {
      const error = new Error('没有可迁移的本机房源数据')
      error.statusCode = 400
      error.code = 'EMPTY_LOCAL_DATA'
      throw error
    }
    await prisma.$transaction((tx) => migrateLocalSnapshot(tx, tenant.id, req.auth.user.id, items), { timeout: 30000 })
    const properties = await readFullProperties(tenant.id)
    res.status(201).json({ ok: true, items: properties.map(serializeFullPropertyTree) })
  } catch (error) { next(error) }
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
