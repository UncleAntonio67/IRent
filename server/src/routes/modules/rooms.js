import express from 'express'
import { z } from 'zod'
import { requireTenant, requireTenantRole } from '../../lib/tenant.js'
import { requireAuth } from '../../middleware/auth.js'
import {
  checkInRoom,
  checkoutRoom,
  collectRent,
  collectUtility,
  getRoomDetail,
  recordMeterReading,
  undoLatestCollection,
  undoRoomOperation,
} from '../../services/rooms.js'

const chargeModeSchema = z.enum(['included', 'separate'])
const utilityBillTypeSchema = z.enum(['WATER', 'ELECTRIC', 'GAS', 'HEATING', 'CUSTOM'])

const nullableMoney = z.number().finite().min(0).nullable().optional()
const nullableReading = z.number().finite().min(0).nullable().optional()
const clientOperationId = z.string().trim().min(8).max(120).optional()

const checkinSchema = z.object({
  tenantName: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(1).max(30),
  idCardNo: z.string().trim().max(50).optional().default(''),
  rentAmount: z.number().finite().positive(),
  depositAmount: z.number().finite().min(0),
  paymentCycleMonths: z.number().int().positive().max(24),
  leaseStartDate: z.string().trim().min(1),
  leaseMonths: z.number().int().positive().max(120),
  waterPrice: nullableMoney,
  electricPrice: nullableMoney,
  gasPrice: nullableMoney,
  heatingPrice: nullableMoney,
  waterChargeMode: chargeModeSchema.default('separate'),
  electricChargeMode: chargeModeSchema.default('separate'),
  gasChargeMode: chargeModeSchema.default('separate'),
  heatingChargeMode: chargeModeSchema.default('separate'),
  lastWaterReading: nullableReading,
  lastElectricReading: nullableReading,
  lastGasReading: nullableReading,
  initialRentAmount: nullableMoney.default(0),
  initialDepositCollectionAmount: nullableMoney.default(0),
  initialPaidAt: z.string().trim().min(1).optional(),
  clientOperationId,
  attachmentIds: z.array(z.string().trim().min(1)).optional().default([]),
})

const rentCollectionSchema = z.object({
  amount: z.number().finite().positive(),
  paidAt: z.string().trim().min(1),
  note: z.string().trim().max(200).optional().default(''),
  attachmentIds: z.array(z.string().trim().min(1)).optional().default([]),
  targetTermId: z.string().trim().min(1).optional().nullable(),
  clientOperationId,
})

const utilityCollectionSchema = z.object({
  billType: utilityBillTypeSchema,
  amount: z.number().finite().positive(),
  paidAt: z.string().trim().min(1),
  note: z.string().trim().max(200).optional().default(''),
  clientOperationId,
  attachmentIds: z.array(z.string().trim().min(1)).optional().default([]),
})

const meterReadingSchema = z.object({
  recordedAt: z.string().trim().min(1),
  waterReading: nullableReading,
  electricReading: nullableReading,
  gasReading: nullableReading,
  clientOperationId,
  attachmentIds: z.array(z.string().trim().min(1)).optional().default([]),
})

const checkoutSchema = z.object({
  checkoutDate: z.string().trim().min(1),
  refundAmount: z.number().finite().min(0).optional().default(0),
  note: z.string().trim().max(200).optional().default(''),
  clientOperationId,
  attachmentIds: z.array(z.string().trim().min(1)).optional().default([]),
})

const undoCollectionSchema = z.object({
  billType: z.enum(['RENT', 'WATER', 'ELECTRIC', 'GAS', 'HEATING', 'CUSTOM', 'DEPOSIT']),
  clientOperationId,
})

const undoOperationSchema = z.object({
  kind: z.enum(['meter_entry', 'checkin', 'checkout']),
  before: z.any().optional().default({}),
  clientOperationId,
})

export const roomRouter = express.Router()

roomRouter.use(requireAuth)

roomRouter.get('/:roomId', async (req, res, next) => {
  try {
    const tenant = requireTenant(req.auth)
    const room = await getRoomDetail(req.params.roomId, tenant.id)
    res.json({
      ok: true,
      room,
    })
  } catch (error) {
    next(error)
  }
})

roomRouter.post('/:roomId/checkin', async (req, res, next) => {
  const parsed = checkinSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'Invalid room check-in payload',
      issues: parsed.error.flatten(),
    })
    return
  }

  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const room = await checkInRoom({
      tenantId: tenant.id,
      userId: req.auth.user.id,
      roomId: req.params.roomId,
      ...parsed.data,
    })
    res.json({
      ok: true,
      room,
    })
  } catch (error) {
    next(error)
  }
})

roomRouter.post('/:roomId/checkout', async (req, res, next) => {
  const parsed = checkoutSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'Invalid room checkout payload',
      issues: parsed.error.flatten(),
    })
    return
  }

  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const room = await checkoutRoom({
      tenantId: tenant.id,
      userId: req.auth.user.id,
      roomId: req.params.roomId,
      ...parsed.data,
    })
    res.json({
      ok: true,
      room,
    })
  } catch (error) {
    next(error)
  }
})

roomRouter.post('/:roomId/rent-collections', async (req, res, next) => {
  const parsed = rentCollectionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'Invalid rent collection payload',
      issues: parsed.error.flatten(),
    })
    return
  }

  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const room = await collectRent({
      tenantId: tenant.id,
      userId: req.auth.user.id,
      roomId: req.params.roomId,
      ...parsed.data,
    })
    res.json({
      ok: true,
      room,
    })
  } catch (error) {
    next(error)
  }
})

roomRouter.post('/:roomId/utility-collections', async (req, res, next) => {
  const parsed = utilityCollectionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'Invalid utility collection payload',
      issues: parsed.error.flatten(),
    })
    return
  }

  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const room = await collectUtility({
      tenantId: tenant.id,
      userId: req.auth.user.id,
      roomId: req.params.roomId,
      ...parsed.data,
    })
    res.json({
      ok: true,
      room,
    })
  } catch (error) {
    next(error)
  }
})

roomRouter.post('/:roomId/undo-latest-collection', async (req, res, next) => {
  const parsed = undoCollectionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, code: 'INVALID_PAYLOAD', message: 'Invalid undo payload', issues: parsed.error.flatten() })
    return
  }
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const room = await undoLatestCollection({
      tenantId: tenant.id,
      userId: req.auth.user.id,
      roomId: req.params.roomId,
      ...parsed.data,
    })
    res.json({ ok: true, room })
  } catch (error) {
    next(error)
  }
})

roomRouter.post('/:roomId/undo-latest-operation', async (req, res, next) => {
  const parsed = undoOperationSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, code: 'INVALID_PAYLOAD', message: 'Invalid undo payload', issues: parsed.error.flatten() })
    return
  }
  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const room = await undoRoomOperation({
      tenantId: tenant.id,
      userId: req.auth.user.id,
      roomId: req.params.roomId,
      ...parsed.data,
    })
    res.json({ ok: true, room })
  } catch (error) {
    next(error)
  }
})

roomRouter.post('/:roomId/meter-readings', async (req, res, next) => {
  const parsed = meterReadingSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'Invalid meter reading payload',
      issues: parsed.error.flatten(),
    })
    return
  }

  try {
    requireTenantRole(req.auth, ['OWNER', 'MANAGER'])
    const tenant = requireTenant(req.auth)
    const room = await recordMeterReading({
      tenantId: tenant.id,
      userId: req.auth.user.id,
      roomId: req.params.roomId,
      ...parsed.data,
    })
    res.json({
      ok: true,
      room,
    })
  } catch (error) {
    next(error)
  }
})
