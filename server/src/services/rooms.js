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

async function writeOperationLog(tx, { tenantId, roomId, userId, action, detail }) {
  await tx.operationLog.create({
    data: {
      tenantId,
      roomId,
      userId,
      action,
      detail,
    },
  })
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
  attachmentIds = [],
}) {
  const leaseStart = startOfDay(leaseStartDate)
  const leaseEnd = buildLeaseEndDate(leaseStart, leaseMonths)

  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
    if (currentRoom.status !== 'EMPTY') {
      const error = new Error('Only empty rooms can be checked in')
      error.statusCode = 409
      error.code = 'ROOM_NOT_EMPTY'
      throw error
    }

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
        waterPrice: toNullableDecimal(waterPrice),
        electricPrice: toNullableDecimal(electricPrice),
        gasPrice: toNullableDecimal(gasPrice),
        heatingPrice: toNullableDecimal(heatingPrice),
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
    const initialPaidDate = startOfDay(initialPaidAt || leaseStart)
    const firstExpectedAmount = toDecimalNumber(firstTerm?.expectedAmount)
    const initialRentPaidAmount = Math.min(
      firstExpectedAmount,
      Math.max(0, toDecimalNumber(initialRentAmount)),
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

    const depositCollectedAmount = Math.min(
      Math.max(0, toDecimalNumber(depositAmount)),
      Math.max(0, toDecimalNumber(initialDepositCollectionAmount)),
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
}) {
  const paidDate = startOfDay(paidAt)
  const paidAmount = toDecimalNumber(amount)

  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
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
}) {
  const paidDate = startOfDay(paidAt)
  const paidAmount = toDecimalNumber(amount)

  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
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
      detail: `附加收费：${currentRoom.roomNo} ${settledBills.map((bill) => bill.title).join('、')} ￥${paidAmount}`,
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
}) {
  const recordDate = startOfDay(recordedAt)

  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
    if (currentRoom.status === 'EMPTY') {
      const error = new Error('Empty room cannot record meter readings')
      error.statusCode = 409
      error.code = 'ROOM_EMPTY'
      throw error
    }

    const waterCost = computeMeterCost(waterReading, currentRoom.lastWaterReading, currentRoom.waterPrice)
    const electricCost = computeMeterCost(
      electricReading,
      currentRoom.lastElectricReading,
      currentRoom.electricPrice
    )
    const gasCost = computeMeterCost(gasReading, currentRoom.lastGasReading, currentRoom.gasPrice)

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
}) {
  const endDate = startOfDay(checkoutDate)
  const refund = toDecimalNumber(refundAmount)

  const room = await prisma.$transaction(async (tx) => {
    const currentRoom = await findScopedRoomOrThrow(tx, roomId, tenantId)
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
          paidAt: endDate,
        },
      })

      await attachFilesToEntity(tx, {
        tenantId,
        attachmentIds,
        roomId,
        collectionId: collection.id,
      })
    }

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
      detail: `办理退租：${currentRoom.roomNo}${refund > 0 ? `，退押金￥${refund}` : ''}${note ? `，${note}` : ''}`,
    })

    return findScopedRoomOrThrow(tx, roomId, tenantId)
  })

  return serializeRoomDetail(room)
}
