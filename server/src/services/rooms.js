import { prisma } from '../db.js'
import { serializeRoomDetail } from '../lib/serializers.js'

function toDecimalNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : fallback
}

function toNullableDecimal(value) {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null
}

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function startOfDay(dateLike) {
  const date = dateLike instanceof Date ? new Date(dateLike) : new Date(dateLike)
  date.setHours(0, 0, 0, 0)
  return date
}

// Lease dates and due dates are date-only values, but a collection is an
// operation and must retain its actual minute.  Mini-program clients send
// local date-time text without an offset, so interpret that form as China
// Standard Time rather than the server's UTC clock.
function operationDate(dateLike) {
  const raw = String(dateLike || '').trim()
  const localMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (localMatch) {
    const [, year, month, day, hour, minute, second = '0'] = localMatch
    return new Date(Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) - 8,
      Number(minute),
      Number(second),
    ))
  }
  const parsed = raw ? new Date(raw) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function addMonths(dateLike, months) {
  const date = startOfDay(dateLike)
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function addDays(dateLike, days) {
  const date = startOfDay(dateLike)
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function buildLeaseEndDate(leaseStartDate, leaseMonths) {
  return addDays(addMonths(leaseStartDate, leaseMonths), -1)
}

function buildPaymentTerms({ roomId, rentAmount, paymentCycleMonths, leaseStartDate, leaseMonths }) {
  const terms = []
  let cursor = startOfDay(leaseStartDate)
  let remainingMonths = leaseMonths
  let termNo = 1

  while (remainingMonths > 0) {
    const termMonths = Math.min(paymentCycleMonths, remainingMonths)
    const termStart = new Date(cursor)
    const termEnd = addDays(addMonths(termStart, termMonths), -1)
    terms.push({
      roomId,
      termNo,
      startDate: termStart,
      endDate: termEnd,
      dueDate: termStart,
      expectedAmount: toDecimalNumber(rentAmount * termMonths),
      paidAmount: 0,
      coveredAmount: 0,
      status: 'UNPAID',
    })
    cursor = addDays(termEnd, 1)
    remainingMonths -= termMonths
    termNo += 1
  }

  return terms
}

function buildCoverageLabel(termNumbers) {
  if (!termNumbers.length) return '未覆盖账期'
  if (termNumbers.length === 1) return `覆盖第${termNumbers[0]}期`
  return `覆盖第${termNumbers[0]}-${termNumbers[termNumbers.length - 1]}期`
}

function buildUtilityBillTitle(billType, date) {
  const dateLabel = date.toISOString().slice(0, 10)
  const map = {
    WATER: '水费',
    ELECTRIC: '电费',
    GAS: '燃气费',
    HEATING: '供暖费',
    CUSTOM: '附加费用',
  }
  return `${dateLabel} ${map[billType] || '费用'}`
}

async function attachFilesToEntity(tx, { tenantId, attachmentIds, roomId, collectionId, meterReadingId }) {
  if (!attachmentIds?.length) return
  await tx.attachment.updateMany({
    where: {
      id: { in: attachmentIds },
      tenantId,
    },
    data: {
      roomId: roomId || null,
      collectionId: collectionId || null,
      meterReadingId: meterReadingId || null,
    },
  })
}

async function writeOperationLog(tx, { tenantId, roomId, userId, action, detail, clientOperationId = '' }) {
  await tx.operationLog.create({
    data: {
      ...(clientOperationId ? { clientOperationId } : {}),
      tenantId,
      roomId,
      userId,
      action,
      detail,
    },
  })
}

async function getIdempotentRoomResult(tx, { tenantId, roomId, clientOperationId }) {
  if (!clientOperationId) return null
  const existing = await tx.operationLog.findUnique({ where: { clientOperationId } })
  if (!existing) return null
  if (existing.tenantId !== tenantId || existing.roomId !== roomId) {
    const error = new Error('Operation id conflicts with another request')
    error.statusCode = 409
    error.code = 'OPERATION_ID_CONFLICT'
    throw error
  }
  return findScopedRoomOrThrow(tx, roomId, tenantId)
}

function computeMeterCost(currentReading, previousReading, unitPrice) {
  const current = Number(currentReading)
  if (!Number.isFinite(current)) return null
  const previous = Number(previousReading || 0)
  const diff = Math.max(0, current - previous)
  return {
    current: Number(current.toFixed(2)),
    previous: Number(previous.toFixed(2)),
    diff: Number(diff.toFixed(2)),
    amount: Number((diff * Number(unitPrice || 0)).toFixed(2)),
  }
}

export const roomDetailInclude = {
  floor: {
    include: {
      block: {
        include: {
          property: true,
        },
      },
    },
  },
  occupancies: {
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
  },
  paymentTerms: {
    orderBy: [{ termNo: 'asc' }],
    include: {
      collections: {
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          attachments: {
            orderBy: [{ uploadedAt: 'desc' }],
          },
        },
      },
    },
  },
  bills: {
    orderBy: [{ createdAt: 'desc' }],
    include: {
      collections: {
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          attachments: {
            orderBy: [{ uploadedAt: 'desc' }],
          },
        },
      },
    },
  },
  collections: {
    orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      attachments: {
        orderBy: [{ uploadedAt: 'desc' }],
      },
    },
  },
  meterReadings: {
    orderBy: [{ recordedAt: 'desc' }],
    include: {
      attachments: {
        orderBy: [{ uploadedAt: 'desc' }],
      },
    },
  },
  attachments: {
    orderBy: [{ uploadedAt: 'desc' }],
  },
}

export async function findScopedRoomOrThrow(client, roomId, tenantId) {
  const room = await client.room.findFirst({
    where: {
      id: roomId,
      floor: {
        block: {
          property: {
            tenantId,
          },
        },
      },
    },
    include: roomDetailInclude,
  })

  if (!room) {
    const error = new Error('Room not found')
    error.statusCode = 404
    error.code = 'ROOM_NOT_FOUND'
    throw error
  }

  return room
}

export async function getRoomDetail(roomId, tenantId) {
  const room = await findScopedRoomOrThrow(prisma, roomId, tenantId)
  return serializeRoomDetail(room)
}

function buildCompletedOccupancyArchive(room) {
  const snapshot = serializeRoomDetail(room)
  const attachments = Array.isArray(snapshot.attachments) ? snapshot.attachments : []
  const filesByType = (type) => attachments.filter((item) => String(item.type || '').toUpperCase() === type)
  return {
    paymentSchedule: snapshot.paymentTerms || [],
    bills: snapshot.bills || [],
    collections: snapshot.collections || [],
    meterReadings: snapshot.meterReadings || [],
    attachmentFiles: {
      idCard: filesByType('ID_CARD'),
      contract: filesByType('CONTRACT'),
    },
    archivedAt: new Date().toISOString(),
  }
}

async function clearActiveRoomBusinessData(tx, roomId) {
  // Completed tenancy data stays in Occupancy.archiveJson. Detach tenant and
  // billing files before deleting their related rows so a subsequent tenant
  // cannot inherit another tenant's documents, bills, collections, or meter
  // records. ROOM_PHOTO is deliberately excluded: it describes the physical
  // room and must survive both checkout and the next check-in. It is only
  // archived/removed when the room itself is deleted.
  await tx.attachment.updateMany({
    where: { roomId, type: { not: 'ROOM_PHOTO' } },
    data: { roomId: null, collectionId: null, meterReadingId: null },
  })
  await tx.collection.deleteMany({ where: { roomId } })
  await tx.bill.deleteMany({ where: { roomId } })
  await tx.paymentTerm.deleteMany({ where: { roomId } })
  await tx.meterReading.deleteMany({ where: { roomId } })
}

async function archiveLegacyEmptyRoomData(tx, currentRoom) {
  const hasCompletedOccupancy = (currentRoom.occupancies || []).some((item) => item.status === 'COMPLETED')
  const hasStaleBusinessData = [
    currentRoom.paymentTerms?.length,
    currentRoom.bills?.length,
    currentRoom.collections?.length,
    currentRoom.meterReadings?.length,
  ].some(Boolean) || hasCompletedOccupancy
  if (!hasStaleBusinessData) return

  const completedOccupancy = (currentRoom.occupancies || []).find((item) => item.status === 'COMPLETED')
  if (completedOccupancy && !completedOccupancy.archiveJson) {
    await tx.occupancy.update({
      where: { id: completedOccupancy.id },
      data: { archiveJson: buildCompletedOccupancyArchive(currentRoom) },
    })
  }
  await clearActiveRoomBusinessData(tx, currentRoom.id)
}

export async function checkInRoom({
  tenantId,
  userId,
  roomId,
  tenantName,
  phone,
  idCardNo,
  rentAmount,
  depositAmount,
  paymentCycleMonths,
  leaseStartDate,
  leaseMonths,
  waterPrice,
  electricPrice,
  gasPrice,
  heatingPrice,
  waterChargeMode,
  electricChargeMode,
  gasChargeMode,
  heatingChargeMode,
  lastWaterReading,
  lastElectricReading,
  lastGasReading,
  initialRentAmount = 0,
  initialDepositCollectionAmount = 0,
  initialPaidAt,
  clientOperationId = '',
  attachmentIds = [],
}) {
  const leaseStart = startOfDay(leaseStartDate)
  const leaseEnd = buildLeaseEndDate(leaseStart, leaseMonths)

  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
    const existingResult = await getIdempotentRoomResult(tx, { tenantId, roomId, clientOperationId })
    if (existingResult) return existingResult
    if (currentRoom.status !== 'EMPTY') {
      const error = new Error('Only empty rooms can be checked in')
      error.statusCode = 409
      error.code = 'ROOM_NOT_EMPTY'
      throw error
    }

    // Older checkouts left the prior tenant's rows on an empty room. Archive
    // and clear them before creating the new tenant's term #1.
    await archiveLegacyEmptyRoomData(tx, currentRoom)

    const updatedRoom = await tx.room.update({
      where: { id: roomId },
      data: {
        status: 'RENTED',
        tenantName,
        phone,
        idCardNo: idCardNo || null,
        rentAmount: toDecimalNumber(rentAmount),
        depositAmount: toDecimalNumber(depositAmount),
        paymentCycleMonths: toInt(paymentCycleMonths),
        leaseStartDate: leaseStart,
        leaseEndDate: leaseEnd,
        // Older clients sent null prices during check-in. Keep a usable room
        // rate so a subsequent meter reading can never silently create ￥0.
        waterPrice: toNullableDecimal(waterPrice) ?? currentRoom.waterPrice ?? 5.5,
        electricPrice: toNullableDecimal(electricPrice) ?? currentRoom.electricPrice ?? 1.2,
        gasPrice: toNullableDecimal(gasPrice) ?? currentRoom.gasPrice ?? 3.8,
        heatingPrice: toNullableDecimal(heatingPrice) ?? currentRoom.heatingPrice ?? 0,
        waterChargeMode,
        electricChargeMode,
        gasChargeMode,
        heatingChargeMode,
        lastWaterReading: toNullableDecimal(lastWaterReading),
        lastElectricReading: toNullableDecimal(lastElectricReading),
        lastGasReading: toNullableDecimal(lastGasReading),
      },
    })

    await tx.occupancy.create({
      data: {
        roomId,
        kind: 'LEASE',
        status: 'ACTIVE',
        tenantName,
        phone,
        idCardNo: idCardNo || null,
        rentAmount: toDecimalNumber(rentAmount),
        depositAmount: toDecimalNumber(depositAmount),
        paymentCycleMonths: toInt(paymentCycleMonths),
        startDate: leaseStart,
        endDate: leaseEnd,
        remark: '办理入住',
      },
    })

    const paymentTerms = buildPaymentTerms({
      roomId,
      rentAmount: toDecimalNumber(rentAmount),
      paymentCycleMonths: toInt(paymentCycleMonths),
      leaseStartDate: leaseStart,
      leaseMonths: toInt(leaseMonths),
    })

    if (paymentTerms.length > 0) {
      await tx.paymentTerm.createMany({
        data: paymentTerms,
      })
    }

    // The "入住收费" drawer represents a real collection, not merely a local
    // confirmation. Settle the first term in the same transaction so a fully
    // paid first period never returns from the cloud as receivable.
    const firstTerm = await tx.paymentTerm.findFirst({
      where: { roomId },
      orderBy: { termNo: 'asc' },
    })
    const initialPaidDate = operationDate(initialPaidAt)
    const firstExpectedAmount = toDecimalNumber(firstTerm?.expectedAmount)
    // A final check-in confirmation represents completed first-period rent.
    // The optional charge drawer may override the amount, but an omitted
    // amount from an older client must not leave the new tenant unpaid.
    const requestedInitialRent = Math.max(0, toDecimalNumber(initialRentAmount))
    const initialRentPaidAmount = Math.min(
      firstExpectedAmount,
      requestedInitialRent > 0 ? requestedInitialRent : firstExpectedAmount,
    )
    if (firstTerm && initialRentPaidAmount > 0) {
      const isFirstTermSettled = initialRentPaidAmount >= firstExpectedAmount
      await tx.paymentTerm.update({
        where: { id: firstTerm.id },
        data: {
          paidAmount: initialRentPaidAmount,
          coveredAmount: initialRentPaidAmount,
          status: isFirstTermSettled ? 'PAID' : 'UNPAID',
          paidAt: initialPaidDate,
        },
      })
      await tx.collection.create({
        data: {
          roomId,
          billType: 'RENT',
          title: `首期房租（第 ${firstTerm.termNo} 期）`,
          amount: initialRentPaidAmount,
          note: '办理入住首期收款',
          coverageLabel: buildCoverageLabel([firstTerm.termNo]),
          paidAt: initialPaidDate,
          relatedTermId: firstTerm.id,
        },
      })
    }

    const expectedDepositAmount = Math.max(0, toDecimalNumber(depositAmount))
    const requestedInitialDeposit = Math.max(0, toDecimalNumber(initialDepositCollectionAmount))
    const depositCollectedAmount = Math.min(
      expectedDepositAmount,
      requestedInitialDeposit > 0 ? requestedInitialDeposit : expectedDepositAmount,
    )
    if (depositCollectedAmount > 0) {
      await tx.collection.create({
        data: {
          roomId,
          billType: 'CUSTOM',
          title: '押金收取',
          amount: depositCollectedAmount,
          note: '办理入住押金收取',
          coverageLabel: '押金',
          paidAt: initialPaidDate,
        },
      })
    }

    await attachFilesToEntity(tx, {
      tenantId,
      attachmentIds,
      roomId,
    })

    await writeOperationLog(tx, {
      tenantId,
      roomId,
      userId,
      action: 'room.checkin',
      clientOperationId,
      detail: `办理入住：${updatedRoom.roomNo} -> ${tenantName}`,
    })

    return findScopedRoomOrThrow(tx, roomId, tenantId)
  })

  return serializeRoomDetail(room)
}

export async function collectRent({
  tenantId,
  userId,
  roomId,
  amount,
  paidAt,
  note,
  attachmentIds = [],
  targetTermId = null,
  clientOperationId = '',
}) {
  const paidDate = operationDate(paidAt)
  const paidAmount = toDecimalNumber(amount)

  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
    const existingResult = await getIdempotentRoomResult(tx, { tenantId, roomId, clientOperationId })
    if (existingResult) return existingResult
    if (currentRoom.status === 'EMPTY') {
      const error = new Error('Empty room cannot collect rent')
      error.statusCode = 409
      error.code = 'ROOM_EMPTY'
      throw error
    }

    const orderedTerms = targetTermId
      ? currentRoom.paymentTerms.filter((term) => term.id === targetTermId)
      : currentRoom.paymentTerms

    if (orderedTerms.length === 0) {
      const error = new Error('Payment term not found')
      error.statusCode = 404
      error.code = 'PAYMENT_TERM_NOT_FOUND'
      throw error
    }

    let remaining = paidAmount
    const appliedTerms = []

    for (const term of orderedTerms) {
      const expected = toDecimalNumber(term.expectedAmount)
      const covered = toDecimalNumber(term.coveredAmount)
      const gap = Math.max(0, toDecimalNumber(expected - covered))
      if (gap <= 0) continue

      const applied = Math.min(gap, remaining)
      const nextCovered = toDecimalNumber(covered + applied)
      await tx.paymentTerm.update({
        where: { id: term.id },
        data: {
          coveredAmount: nextCovered,
          paidAmount: nextCovered,
          status: nextCovered >= expected ? 'PAID' : 'UNPAID',
          paidAt: paidDate,
        },
      })

      appliedTerms.push({ id: term.id, termNo: term.termNo })
      remaining = toDecimalNumber(remaining - applied)
      if (remaining <= 0) break
    }

    const collection = await tx.collection.create({
      data: {
        roomId,
        billType: 'RENT',
        title: '租金收款',
        amount: paidAmount,
        note: note || null,
        coverageLabel: buildCoverageLabel(appliedTerms.map((term) => term.termNo)),
        paidAt: paidDate,
        relatedTermId: appliedTerms.length === 1 ? appliedTerms[0].id : null,
      },
    })

    await attachFilesToEntity(tx, {
      tenantId,
      attachmentIds,
      roomId,
      collectionId: collection.id,
    })

    await writeOperationLog(tx, {
      tenantId,
      roomId,
      userId,
      action: 'room.collect_rent',
      clientOperationId,
      detail: `房租收款：${currentRoom.roomNo} ￥${paidAmount}`,
    })

    return findScopedRoomOrThrow(tx, roomId, tenantId)
  })

  return serializeRoomDetail(room)
}

export async function collectUtility({
  tenantId,
  userId,
  roomId,
  billType,
  amount,
  paidAt,
  note,
  attachmentIds = [],
  clientOperationId = '',
}) {
  const paidDate = operationDate(paidAt)
  const paidAmount = toDecimalNumber(amount)

  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
    const existingResult = await getIdempotentRoomResult(tx, { tenantId, roomId, clientOperationId })
    if (existingResult) return existingResult
    if (currentRoom.status === 'EMPTY') {
      const error = new Error('Empty room cannot collect utility fees')
      error.statusCode = 409
      error.code = 'ROOM_EMPTY'
      throw error
    }

    const unpaidBills = await tx.bill.findMany({
      where: { roomId, type: billType, status: 'UNPAID' },
      orderBy: { createdAt: 'asc' },
    })
    const outstandingAmount = unpaidBills.reduce((sum, bill) => sum + toDecimalNumber(bill.amount), 0)
    const hasMeterReceivable = outstandingAmount > 0
    if (hasMeterReceivable && Math.abs(paidAmount - outstandingAmount) >= 0.005) {
      const error = new Error('Collection amount must match the outstanding metered utility fees')
      error.statusCode = 422
      error.code = 'UTILITY_COLLECTION_AMOUNT_MISMATCH'
      throw error
    }

    const settledBills = hasMeterReceivable
      ? await Promise.all(unpaidBills.map((bill) => tx.bill.update({
        where: { id: bill.id },
        data: { status: 'PAID', paidAt: paidDate },
      })))
      : [await tx.bill.create({
        data: {
          roomId,
          type: billType,
          title: buildUtilityBillTitle(billType, paidDate),
          amount: paidAmount,
          status: 'PAID',
          dueDate: paidDate,
          paidAt: paidDate,
        },
      })]

    const collections = await Promise.all(settledBills.map((bill) => tx.collection.create({
      data: {
        roomId,
        billType,
        title: bill.title,
        amount: hasMeterReceivable ? toDecimalNumber(bill.amount) : paidAmount,
        note: note || null,
        coverageLabel: null,
        paidAt: paidDate,
        relatedBillId: bill.id,
      },
    })))

    await attachFilesToEntity(tx, {
      tenantId,
      attachmentIds,
      roomId,
      collectionId: collections[0]?.id,
    })

    await writeOperationLog(tx, {
      tenantId,
      roomId,
      userId,
      action: 'room.collect_utility',
      clientOperationId,
      detail: `附加收费：${currentRoom.roomNo} ${settledBills.map((bill) => bill.title).join('、')} ￥${paidAmount}`,
    })

    return findScopedRoomOrThrow(tx, roomId, tenantId)
  })

  return serializeRoomDetail(room)
}

export async function undoLatestCollection({
  tenantId,
  userId,
  roomId,
  billType,
  clientOperationId = '',
}) {
  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
    const existingResult = await getIdempotentRoomResult(tx, { tenantId, roomId, clientOperationId })
    if (existingResult) return existingResult

    const collection = await tx.collection.findFirst({
      where: { roomId, billType },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { bill: true },
    })
    if (!collection) {
      const error = new Error('Collection not found or already undone')
      error.statusCode = 404
      error.code = 'COLLECTION_NOT_FOUND'
      throw error
    }

    // Direct utility collection creates its bill and collection together, so
    // both are removed. A bill produced by a prior meter reading is instead
    // restored to unpaid, keeping the meter receivable but removing its ledger
    // collection.
    if (collection.relatedBillId && collection.bill) {
      const billCreatedAt = collection.bill.createdAt?.getTime?.() || 0
      const collectionCreatedAt = collection.createdAt?.getTime?.() || 0
      const createdTogether = billCreatedAt && collectionCreatedAt && Math.abs(collectionCreatedAt - billCreatedAt) < 5000
      if (createdTogether) {
        await tx.bill.delete({ where: { id: collection.relatedBillId } })
      } else {
        await tx.bill.update({ where: { id: collection.relatedBillId }, data: { status: 'UNPAID', paidAt: null } })
      }
    }
    await tx.attachment.deleteMany({ where: { collectionId: collection.id } })
    await tx.collection.delete({ where: { id: collection.id } })

    await writeOperationLog(tx, {
      tenantId,
      roomId,
      userId,
      action: 'room.undo_collection',
      clientOperationId,
      detail: `Undo collection ${currentRoom.roomNo} ${billType} ${collection.amount}`,
    })
    return findScopedRoomOrThrow(tx, roomId, tenantId)
  })
  return serializeRoomDetail(room)
}

function roomRestoreData(before = {}) {
  const status = String(before.status || '').toUpperCase()
  return {
    status: status === 'RENTED' || status === 'OVERDUE' || status === 'DUE_SOON' ? status : 'EMPTY',
    tenantName: before.tenant || null,
    phone: before.phone || null,
    idCardNo: before.idCard || null,
    rentAmount: toNullableDecimal(before.rent),
    depositAmount: toNullableDecimal(before.deposit),
    paymentCycleMonths: before.paymentCycle ? toInt(before.paymentCycle) : null,
    leaseStartDate: before.leaseStart ? startOfDay(before.leaseStart) : null,
    leaseEndDate: before.leaseEnd ? startOfDay(before.leaseEnd) : null,
    lastWaterReading: toNullableDecimal(before.lastWater),
    lastElectricReading: toNullableDecimal(before.lastElectric),
    lastGasReading: toNullableDecimal(before.lastGas),
  }
}

export async function undoRoomOperation({
  tenantId,
  userId,
  roomId,
  kind,
  before = {},
  clientOperationId = '',
}) {
  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
    const existingResult = await getIdempotentRoomResult(tx, { tenantId, roomId, clientOperationId })
    if (existingResult) return existingResult

    if (kind === 'meter_entry') {
      const reading = await tx.meterReading.findFirst({ where: { roomId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
      if (!reading) throw Object.assign(new Error('Meter reading not found or already undone'), { statusCode: 404, code: 'METER_READING_NOT_FOUND' })
      // The latest local operation is being undone, therefore later unpaid
      // meter bills belong to this reading and can be safely removed.
      await tx.bill.deleteMany({ where: { roomId, status: 'UNPAID', createdAt: { gte: reading.createdAt } } })
      await tx.attachment.deleteMany({ where: { meterReadingId: reading.id } })
      await tx.meterReading.delete({ where: { id: reading.id } })
      await tx.room.update({ where: { id: roomId }, data: roomRestoreData(before) })
    } else if (kind === 'checkin') {
      const occupancy = await tx.occupancy.findFirst({ where: { roomId, status: 'ACTIVE' }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
      if (!occupancy) throw Object.assign(new Error('Active check-in not found or already undone'), { statusCode: 404, code: 'CHECKIN_NOT_FOUND' })
      const since = occupancy.createdAt
      const recentCollections = await tx.collection.findMany({ where: { roomId, createdAt: { gte: since } }, select: { id: true } })
      if (recentCollections.length) await tx.attachment.deleteMany({ where: { collectionId: { in: recentCollections.map((item) => item.id) } } })
      await tx.collection.deleteMany({ where: { roomId, createdAt: { gte: since } } })
      await tx.paymentTerm.deleteMany({ where: { roomId, createdAt: { gte: since } } })
      await tx.bill.deleteMany({ where: { roomId, createdAt: { gte: since } } })
      await tx.meterReading.deleteMany({ where: { roomId, createdAt: { gte: since } } })
      await tx.occupancy.delete({ where: { id: occupancy.id } })
      await tx.room.update({ where: { id: roomId }, data: roomRestoreData(before) })
    } else if (kind === 'checkout') {
      const occupancy = await tx.occupancy.findFirst({ where: { roomId, status: 'COMPLETED' }, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }] })
      if (!occupancy) throw Object.assign(new Error('Completed tenancy not found or already undone'), { statusCode: 404, code: 'CHECKOUT_NOT_FOUND' })
      const refund = await tx.collection.findFirst({ where: { roomId, billType: 'DEPOSIT', amount: { lt: 0 } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
      if (refund) {
        await tx.attachment.deleteMany({ where: { collectionId: refund.id } })
        await tx.collection.delete({ where: { id: refund.id } })
      }
      await tx.occupancy.update({ where: { id: occupancy.id }, data: { status: 'ACTIVE', endDate: null } })
      await tx.room.update({
        where: { id: roomId },
        data: {
          status: 'RENTED',
          tenantName: occupancy.tenantName,
          phone: occupancy.phone,
          idCardNo: occupancy.idCardNo,
          rentAmount: occupancy.rentAmount,
          depositAmount: occupancy.depositAmount,
          paymentCycleMonths: occupancy.paymentCycleMonths,
          leaseStartDate: occupancy.startDate,
          leaseEndDate: before.leaseEnd ? startOfDay(before.leaseEnd) : null,
        },
      })
    } else {
      throw Object.assign(new Error('Unsupported undo operation'), { statusCode: 422, code: 'UNDO_NOT_SUPPORTED' })
    }

    await writeOperationLog(tx, {
      tenantId,
      roomId,
      userId,
      action: `room.undo_${kind}`,
      clientOperationId,
      detail: `Undo ${kind} for ${currentRoom.roomNo}`,
    })
    return findScopedRoomOrThrow(tx, roomId, tenantId)
  })
  return serializeRoomDetail(room)
}

export async function recordMeterReading({
  tenantId,
  userId,
  roomId,
  recordedAt,
  waterReading = null,
  electricReading = null,
  gasReading = null,
  attachmentIds = [],
  clientOperationId = '',
}) {
  const recordDate = startOfDay(recordedAt)

  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
    const existingResult = await getIdempotentRoomResult(tx, { tenantId, roomId, clientOperationId })
    if (existingResult) return existingResult
    if (currentRoom.status === 'EMPTY') {
      const error = new Error('Empty room cannot record meter readings')
      error.statusCode = 409
      error.code = 'ROOM_EMPTY'
      throw error
    }

    // Rooms checked in by an older client may still have a null unit price.
    // Fall back here as well so their very next meter reading produces a bill.
    const waterCost = computeMeterCost(waterReading, currentRoom.lastWaterReading, currentRoom.waterPrice ?? 5.5)
    const electricCost = computeMeterCost(
      electricReading,
      currentRoom.lastElectricReading,
      currentRoom.electricPrice ?? 1.2
    )
    const gasCost = computeMeterCost(gasReading, currentRoom.lastGasReading, currentRoom.gasPrice ?? 3.8)

    const totalAmount = [waterCost, electricCost, gasCost]
      .filter(Boolean)
      .reduce((sum, item) => sum + item.amount, 0)

    const meterReading = await tx.meterReading.create({
      data: {
        roomId,
        waterReading: waterCost?.current ?? null,
        electricReading: electricCost?.current ?? null,
        gasReading: gasCost?.current ?? null,
        totalAmount: toDecimalNumber(totalAmount),
        recordedAt: recordDate,
      },
    })

    await attachFilesToEntity(tx, {
      tenantId,
      attachmentIds,
      roomId,
      meterReadingId: meterReading.id,
    })

    const bills = []
    if (waterCost && waterCost.amount > 0) {
      bills.push({
        roomId,
        type: 'WATER',
        title: buildUtilityBillTitle('WATER', recordDate),
        amount: waterCost.amount,
        status: 'UNPAID',
        dueDate: recordDate,
      })
    }
    if (electricCost && electricCost.amount > 0) {
      bills.push({
        roomId,
        type: 'ELECTRIC',
        title: buildUtilityBillTitle('ELECTRIC', recordDate),
        amount: electricCost.amount,
        status: 'UNPAID',
        dueDate: recordDate,
      })
    }
    if (gasCost && gasCost.amount > 0) {
      bills.push({
        roomId,
        type: 'GAS',
        title: buildUtilityBillTitle('GAS', recordDate),
        amount: gasCost.amount,
        status: 'UNPAID',
        dueDate: recordDate,
      })
    }

    if (bills.length > 0) {
      await tx.bill.createMany({ data: bills })
    }

    await tx.room.update({
      where: { id: roomId },
      data: {
        lastWaterReading: waterCost?.current ?? currentRoom.lastWaterReading,
        lastElectricReading: electricCost?.current ?? currentRoom.lastElectricReading,
        lastGasReading: gasCost?.current ?? currentRoom.lastGasReading,
      },
    })

    const detailParts = [
      waterCost ? `水费￥${waterCost.amount}` : null,
      electricCost ? `电费￥${electricCost.amount}` : null,
      gasCost ? `燃气费￥${gasCost.amount}` : null,
    ].filter(Boolean)

    await writeOperationLog(tx, {
      tenantId,
      roomId,
      userId,
      action: 'room.meter_reading',
      clientOperationId,
      detail: `录入抄表：${currentRoom.roomNo}，${detailParts.join('，') || '无新增费用'}`,
    })

    return findScopedRoomOrThrow(tx, roomId, tenantId)
  })

  return serializeRoomDetail(room)
}

export async function checkoutRoom({
  tenantId,
  userId,
  roomId,
  checkoutDate,
  refundAmount = 0,
  note = '',
  attachmentIds = [],
  clientOperationId = '',
}) {
  const endDate = startOfDay(checkoutDate)
  const checkoutOperationDate = new Date()
  const refund = toDecimalNumber(refundAmount)

  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
    const existingResult = await getIdempotentRoomResult(tx, { tenantId, roomId, clientOperationId })
    if (existingResult) return existingResult
    if (currentRoom.status === 'EMPTY') {
      const error = new Error('Room is already empty')
      error.statusCode = 409
      error.code = 'ROOM_ALREADY_EMPTY'
      throw error
    }

    const activeOccupancy = currentRoom.occupancies.find((item) => item.status === 'ACTIVE')
    if (activeOccupancy) {
      await tx.occupancy.update({
        where: { id: activeOccupancy.id },
        data: {
          status: 'COMPLETED',
          endDate,
          remark: note || activeOccupancy.remark || '办理退租',
        },
      })
    }

    if (refund > 0) {
      const collection = await tx.collection.create({
        data: {
          roomId,
          billType: 'DEPOSIT',
          title: '押金退还',
          amount: -refund,
          note: note || '退租押金退款',
          coverageLabel: null,
          paidAt: checkoutOperationDate,
        },
      })

      await attachFilesToEntity(tx, {
        tenantId,
        attachmentIds,
        roomId,
        collectionId: collection.id,
      })
    }

    // Keep the completed lease as a self-contained snapshot, then remove its
    // active business rows. This makes every future check-in start clean.
    const roomForArchive = await findScopedRoomOrThrow(tx, roomId, tenantId)
    if (activeOccupancy) {
      await tx.occupancy.update({
        where: { id: activeOccupancy.id },
        data: { archiveJson: buildCompletedOccupancyArchive(roomForArchive) },
      })
    }
    await clearActiveRoomBusinessData(tx, roomId)

    await tx.room.update({
      where: { id: roomId },
      data: {
        status: 'EMPTY',
        tenantName: null,
        phone: null,
        idCardNo: null,
        rentAmount: null,
        depositAmount: null,
        paymentCycleMonths: null,
        leaseStartDate: null,
        leaseEndDate: null,
      },
    })

    await writeOperationLog(tx, {
      tenantId,
      roomId,
      userId,
      action: 'room.checkout',
      clientOperationId,
      detail: `办理退租：${currentRoom.roomNo}${refund > 0 ? `，退押金￥${refund}` : ''}${note ? `，${note}` : ''}`,
    })

    return findScopedRoomOrThrow(tx, roomId, tenantId)
  })

  return serializeRoomDetail(room)
}
