import {
  BILL_TYPE,
  OCCUPANCY_KIND,
  OCCUPANCY_STATUS,
  PAYMENT_STATUS,
  ROOM_STATUS,
  generateId,
} from './rent-models.js'

const UTILITY_BILL_TYPES = [BILL_TYPE.WATER, BILL_TYPE.ELECTRIC, BILL_TYPE.GAS, BILL_TYPE.HEATING, 'utilities']

function sum(items, accessor) {
  return Math.round(items.reduce((total, item) => total + accessor(item), 0) * 100) / 100
}

function progress(paid, expected) {
  if (!expected) return 0
  return Math.min(100, Math.max(0, Math.round((paid / expected) * 100)))
}

function ensureCollections(room) {
  room.collections = Array.isArray(room.collections) ? room.collections : []
  return room.collections
}

function ensureRoomPhotos(room) {
  room.roomPhotos = Array.isArray(room.roomPhotos) ? room.roomPhotos : []
  return room.roomPhotos
}

export function createRoomTreeMutator(nextProperties, propertyId, blockId, roomId) {
  const property = nextProperties.find((item) => item.id === propertyId)
  if (!property) return null

  const block = (property.blocks || []).find((item) => item.id === blockId)
  if (!block) return null

  for (const floorItem of block.floors || []) {
    const room = (floorItem.rooms || []).find((item) => item.id === roomId)
    if (room) return { property, block, floor: floorItem, room }
  }

  return null
}

export function computeCollectionSummary(room) {
  const paymentSchedule = room?.paymentSchedule || []
  const collections = room?.collections || []
  const utilityBills = (room?.bills || []).filter((bill) => UTILITY_BILL_TYPES.includes(bill.type))
  const customBills = (room?.bills || []).filter((bill) => bill.type === BILL_TYPE.CUSTOM)

  const legacyRentCollections = paymentSchedule
    .filter((term) => Number(term.paidAmount || 0) > 0)
    .map((term) => ({
      id: `legacy_${term.id}`,
      kind: BILL_TYPE.RENT,
      title: `房租 第${term.term}期`,
      amount: Number(term.paidAmount || 0),
      paidAt: term.payDate || '',
      receiptPic: Boolean(term.receiptPic),
      termIds: [term.id],
      billId: '',
      note: 'legacy',
      coverageLabel: `覆盖第 ${term.term} 期`,
    }))

  const rentCollectionSource = collections.some((item) => item.kind === BILL_TYPE.RENT)
    ? collections.filter((item) => item.kind === BILL_TYPE.RENT)
    : legacyRentCollections

  const rentExpected = sum(paymentSchedule, (term) => Number(term.expectedAmount || 0))
  const rentPaid = sum(rentCollectionSource, (item) => Number(item.amount || 0))
  const rentOutstandingAmount = Math.max(0, Math.round((rentExpected - rentPaid) * 100) / 100)
  const rentOutstandingCount = paymentSchedule.filter(
    (term) => Number(term.coveredAmount || term.paidAmount || 0) < Number(term.expectedAmount || 0)
  ).length

  const utilityExpected = sum(utilityBills, (bill) => Number(bill.amount || 0))
  const utilityPaid = sum(
    collections.filter((item) => UTILITY_BILL_TYPES.includes(item.kind)),
    (item) => Number(item.amount || 0)
  )
  const utilityOutstandingCount = utilityBills.filter((bill) => bill.status !== PAYMENT_STATUS.PAID).length

  const customExpected = sum(customBills, (bill) => Number(bill.amount || 0))
  const customPaid = sum(
    collections.filter((item) => item.kind === BILL_TYPE.CUSTOM),
    (item) => Number(item.amount || 0)
  )
  const customOutstandingCount = customBills.filter((bill) => bill.status !== PAYMENT_STATUS.PAID).length

  const totalExpected = Math.round((rentExpected + utilityExpected + customExpected) * 100) / 100
  const totalPaid = Math.round((rentPaid + utilityPaid + customPaid) * 100) / 100

  return {
    collections,
    paymentSchedule,
    utilityBills,
    utilitiesBills: utilityBills,
    customBills,
    unpaidBills: (room?.bills || []).filter((bill) => bill.status !== PAYMENT_STATUS.PAID),
    rent: {
      expected: rentExpected,
      paid: rentPaid,
      outstandingAmount: rentOutstandingAmount,
      outstandingCount: rentOutstandingCount,
      progressPct: progress(rentPaid, rentExpected),
      recentCollections: rentCollectionSource.slice().sort((a, b) => String(b.paidAt || '').localeCompare(String(a.paidAt || ''))),
    },
    utilities: {
      expected: utilityExpected,
      paid: utilityPaid,
      outstandingAmount: Math.max(0, Math.round((utilityExpected - utilityPaid) * 100) / 100),
      outstandingCount: utilityOutstandingCount,
      progressPct: progress(utilityPaid, utilityExpected),
      recentCollections: collections
        .filter((item) => UTILITY_BILL_TYPES.includes(item.kind))
        .slice()
        .sort((a, b) => String(b.paidAt || '').localeCompare(String(a.paidAt || ''))),
      byType: UTILITY_BILL_TYPES.map((type) => {
        const expected = sum(
          utilityBills.filter((bill) => bill.type === type),
          (bill) => Number(bill.amount || 0)
        )
        const paid = sum(
          collections.filter((item) => item.kind === type),
          (item) => Number(item.amount || 0)
        )
        return {
          type,
          expected,
          paid,
          outstanding: Math.max(0, Math.round((expected - paid) * 100) / 100),
        }
      }),
    },
    custom: {
      expected: customExpected,
      paid: customPaid,
      outstandingAmount: Math.max(0, Math.round((customExpected - customPaid) * 100) / 100),
      outstandingCount: customOutstandingCount,
      recentCollections: collections
        .filter((item) => item.kind === BILL_TYPE.CUSTOM)
        .slice()
        .sort((a, b) => String(b.paidAt || '').localeCompare(String(a.paidAt || ''))),
    },
    overall: {
      expected: totalExpected,
      paid: totalPaid,
      outstandingAmount: Math.max(0, Math.round((totalExpected - totalPaid) * 100) / 100),
      outstandingCount: rentOutstandingCount + utilityOutstandingCount + customOutstandingCount,
      progressPct: progress(totalPaid, totalExpected),
    },
  }
}

export function computeMeterCharge(room, meterForm) {
  if (!room) return null

  const waterNow = Number(meterForm?.water)
  const electricNow = Number(meterForm?.electric)
  const gasNow = Number(meterForm?.gas)
  const hasWater = Number.isFinite(waterNow)
  const hasElectric = Number.isFinite(electricNow)
  const hasGas = Number.isFinite(gasNow)
  if (!hasWater && !hasElectric && !hasGas) return null

  const waterDiff = hasWater ? Math.max(0, Number((waterNow - Number(room.lastWater || 0)).toFixed(1))) : 0
  const electricDiff = hasElectric ? Math.max(0, Number((electricNow - Number(room.lastElectric || 0)).toFixed(1))) : 0
  const gasDiff = hasGas ? Math.max(0, Number((gasNow - Number(room.lastGas || 0)).toFixed(1))) : 0
  const waterCost = Number((waterDiff * Number(room.waterPrice || 0)).toFixed(2))
  const electricCost = Number((electricDiff * Number(room.electricPrice || 0)).toFixed(2))
  const gasCost = Number((gasDiff * Number(room.gasPrice || 0)).toFixed(2))
  const total = Number((waterCost + electricCost + gasCost).toFixed(2))

  return {
    waterDiff,
    electricDiff,
    gasDiff,
    waterCost,
    electricCost,
    gasCost,
    total,
    waterNow: hasWater ? waterNow : Number(room.lastWater || 0),
    electricNow: hasElectric ? electricNow : Number(room.lastElectric || 0),
    gasNow: hasGas ? gasNow : Number(room.lastGas || 0),
  }
}

export function buildAttachmentFile(type, { tenant = '租客', roomNo = '房间', now }) {
  if (type === 'idCard') {
    return {
      name: `${tenant}_id_card.jpg`,
      uploadedAt: now,
      source: 'mock',
      previewText: '身份证正反面影像（模拟）',
    }
  }

  return {
    name: `${roomNo}_lease_contract.pdf`,
    uploadedAt: now,
    source: 'mock',
    previewText: '电子租赁合同归档文件（模拟）',
  }
}

export function buildRoomPhotoFile(room, { now, remark = '' } = {}) {
  return {
    id: generateId('photo'),
    name: `${room?.roomNo || 'room'}_photo_${Date.now()}.jpg`,
    uploadedAt: now,
    source: 'mock',
    previewText: '房屋照片预览（模拟）',
    remark,
  }
}

export function uploadRoomPhoto(room, { now, remark = '' } = {}) {
  const next = buildRoomPhotoFile(room, { now, remark })
  ensureRoomPhotos(room).unshift(next)
  room.history.unshift({
    id: generateId('h'),
    type: 'upload_room_photo',
    date: now,
    remark: `上传房屋照片${remark ? `：${remark}` : ''}`,
  })
  return next
}

export function markPaymentTermPaid(room, termId, { now, receiptPicked, amount, note = '' }) {
  const term = (room.paymentSchedule || []).find((item) => item.id === termId)
  if (!term) return false

  const remaining = Math.max(0, Number(term.expectedAmount || 0) - Number(term.coveredAmount || term.paidAmount || 0))
  const paidAmount = Number(amount || remaining || term.expectedAmount || 0)
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) return false

  const nextCoveredAmount = Math.min(
    Number(term.expectedAmount || 0),
    Number(term.coveredAmount || term.paidAmount || 0) + paidAmount
  )
  term.coveredAmount = nextCoveredAmount
  term.paidAmount = nextCoveredAmount
  term.payDate = now
  term.receiptPic = Boolean(receiptPicked)
  term.status = nextCoveredAmount >= Number(term.expectedAmount || 0) ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.UNPAID

  ensureCollections(room).unshift({
    id: generateId('col'),
    kind: BILL_TYPE.RENT,
    title: `房租 第${term.term}期`,
    amount: Number(paidAmount.toFixed(2)),
    paidAt: now,
    receiptPic: Boolean(receiptPicked),
    termIds: [term.id],
    billId: '',
    note,
    coverageLabel: `覆盖第 ${term.term} 期`,
  })

  room.history.unshift({
    id: generateId('h'),
    type: 'rent_writeoff',
    date: now,
    remark: `记收房租：第 ${term.term} 期，￥${Number(paidAmount.toFixed(2))}`,
  })
  return true
}

export function addCustomCharge(room, { title, amount, now }) {
  const dueDate = now.slice(0, 10)
  room.bills.unshift({
    id: generateId('bill'),
    title,
    type: BILL_TYPE.CUSTOM,
    amount: Number(amount.toFixed(2)),
    status: PAYMENT_STATUS.UNPAID,
    dueDate,
    payDate: '',
    receiptPic: false,
  })
  room.history.unshift({
    id: generateId('h'),
    type: 'custom_charge',
    date: now,
    remark: `新增灵活收费：${title}，￥${Number(amount.toFixed(2))}`,
  })
}

export function addHeatingBill(room, { title = '供暖费', amount, dueDate, now }) {
  room.bills.unshift({
    id: generateId('bill'),
    title,
    type: BILL_TYPE.HEATING,
    amount: Number(amount.toFixed(2)),
    status: PAYMENT_STATUS.UNPAID,
    dueDate: dueDate || now.slice(0, 10),
    payDate: '',
    receiptPic: false,
  })
}

export function recordRentCollection(room, { amount, note = '', now, receiptPicked = false }) {
  const paidAmount = Number(amount || 0)
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) return false

  const coveredTermIds = []
  let remaining = Number(paidAmount.toFixed(2))

  for (const term of room.paymentSchedule || []) {
    const expected = Number(term.expectedAmount || 0)
    const covered = Number(term.coveredAmount || term.paidAmount || 0)
    const gap = Math.max(0, Number((expected - covered).toFixed(2)))
    if (gap <= 0) continue

    const applied = Math.min(gap, remaining)
    const nextCovered = Number((covered + applied).toFixed(2))
    term.coveredAmount = nextCovered
    term.paidAmount = nextCovered
    term.payDate = now
    term.receiptPic = Boolean(receiptPicked)
    term.status = nextCovered >= expected ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.UNPAID
    coveredTermIds.push(term.id)
    remaining = Number((remaining - applied).toFixed(2))
    if (remaining <= 0) break
  }

  ensureCollections(room).unshift({
    id: generateId('col'),
    kind: BILL_TYPE.RENT,
    title: '租金收款',
    amount: Number(paidAmount.toFixed(2)),
    paidAt: now,
    receiptPic: Boolean(receiptPicked),
    termIds: coveredTermIds,
    billId: '',
    note,
    coverageLabel: coveredTermIds.length > 0 ? `覆盖 ${coveredTermIds.length} 条账期` : '未分配账期',
  })

  room.history.unshift({
    id: generateId('h'),
    type: 'rent_collect',
    date: now,
    remark: `直接收租：￥${Number(paidAmount.toFixed(2))}${note ? `，${note}` : ''}`,
  })
  return true
}

export function recordDirectUtilityCollection(room, { type = BILL_TYPE.WATER, amount, title = '', note = '', now, receiptPicked = false }) {
  const paidAmount = Number(amount || 0)
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) return false

  const resolvedTitle = title || `${now.slice(0, 10)} ${type}`
  const billId = generateId('bill')
  room.bills.unshift({
    id: billId,
    title: resolvedTitle,
    type,
    amount: Number(paidAmount.toFixed(2)),
    status: PAYMENT_STATUS.PAID,
    dueDate: now.slice(0, 10),
    payDate: now,
    receiptPic: Boolean(receiptPicked),
  })

  ensureCollections(room).unshift({
    id: generateId('col'),
    kind: type,
    title: resolvedTitle,
    amount: Number(paidAmount.toFixed(2)),
    paidAt: now,
    receiptPic: Boolean(receiptPicked),
    termIds: [],
    billId,
    note,
  })

  room.history.unshift({
    id: generateId('h'),
    type: 'utility_collect',
    date: now,
    remark: `直接收费：${resolvedTitle}，￥${Number(paidAmount.toFixed(2))}${note ? `，${note}` : ''}`,
  })
  return true
}

export function markBillPaid(room, billId, { now, receiptPicked, amount, note = '' }) {
  const bill = (room.bills || []).find((item) => item.id === billId)
  if (!bill || bill.status === PAYMENT_STATUS.PAID) return false

  const paidAmount = Number(amount || bill.amount || 0)
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) return false

  bill.status = PAYMENT_STATUS.PAID
  bill.payDate = now
  bill.receiptPic = Boolean(receiptPicked)

  ensureCollections(room).unshift({
    id: generateId('col'),
    kind: bill.type || BILL_TYPE.CUSTOM,
    title: bill.title || '费用',
    amount: Number(paidAmount.toFixed(2)),
    paidAt: now,
    receiptPic: Boolean(receiptPicked),
    termIds: [],
    billId: bill.id,
    note,
  })

  room.history.unshift({
    id: generateId('h'),
    type: 'writeoff',
    date: now,
    remark: `记收账单：${bill.title}，￥${paidAmount}`,
  })
  return true
}

export function createUtilitiesBillFromMeter(room, meterCalc, { now }) {
  const nowDate = now.slice(0, 10)
  const meterReadingId = generateId('mr')

  room.meterReadings.unshift({
    id: meterReadingId,
    date: nowDate,
    waterRead: meterCalc.waterNow,
    electricRead: meterCalc.electricNow,
    gasRead: meterCalc.gasNow,
    total: meterCalc.total,
  })

  const createdBills = []
  if (meterCalc.waterCost > 0) {
    createdBills.push({
      id: generateId('bill'),
      title: `${nowDate} 水费`,
      type: BILL_TYPE.WATER,
      amount: meterCalc.waterCost,
      status: PAYMENT_STATUS.UNPAID,
      dueDate: nowDate,
      payDate: '',
      receiptPic: false,
    })
  }
  if (meterCalc.electricCost > 0) {
    createdBills.push({
      id: generateId('bill'),
      title: `${nowDate} 电费`,
      type: BILL_TYPE.ELECTRIC,
      amount: meterCalc.electricCost,
      status: PAYMENT_STATUS.UNPAID,
      dueDate: nowDate,
      payDate: '',
      receiptPic: false,
    })
  }
  if (meterCalc.gasCost > 0) {
    createdBills.push({
      id: generateId('bill'),
      title: `${nowDate} 天然气费`,
      type: BILL_TYPE.GAS,
      amount: meterCalc.gasCost,
      status: PAYMENT_STATUS.UNPAID,
      dueDate: nowDate,
      payDate: '',
      receiptPic: false,
    })
  }

  room.bills.unshift(...createdBills)
  room.lastWater = meterCalc.waterNow
  room.lastElectric = meterCalc.electricNow
  room.lastGas = meterCalc.gasNow
  room.history.unshift({
    id: generateId('h'),
    type: 'meter',
    date: now,
    remark: `录入抄表并生成费用：水 ￥${meterCalc.waterCost}，电 ￥${meterCalc.electricCost}，气 ￥${meterCalc.gasCost}，合计 ￥${meterCalc.total}`,
  })
}

export function uploadRoomAttachment(room, type, { now }) {
  if (type === 'idCard') room.hasIdCardPic = true
  if (type === 'contract') room.hasContract = true

  room.attachmentFiles = room.attachmentFiles || { idCard: null, contract: null }
  room.attachmentFiles[type] = buildAttachmentFile(type, {
    tenant: room.tenant || '租客',
    roomNo: room.roomNo || '房间',
    now,
  })

  room.history.unshift({
    id: generateId('h'),
    type: type === 'idCard' ? 'upload_id' : 'upload_contract',
    date: now,
    remark: type === 'idCard' ? '上传身份证照片（模拟）' : '上传合同扫描件（模拟）',
  })

  return room.attachmentFiles[type]
}

export function checkInRoom(room, payload, { now, paymentSchedule, attachments }) {
  const nowDate = now.slice(0, 10)

  const lastIdle = (room.occupancies || []).find(
    (occupancy) =>
      occupancy.kind === OCCUPANCY_KIND.IDLE &&
      (!occupancy.endDate || occupancy.endDate === '') &&
      occupancy.status === OCCUPANCY_STATUS.IDLE
  )
  if (lastIdle) lastIdle.endDate = nowDate

  const occupancyId = generateId('oc')
  room.occupancies = Array.isArray(room.occupancies) ? room.occupancies : []
  room.occupancies.unshift({
    id: occupancyId,
    kind: OCCUPANCY_KIND.LEASE,
    status: OCCUPANCY_STATUS.ACTIVE,
    tenant: payload.tenant,
    phone: payload.phone,
    idCard: payload.idCard,
    startDate: payload.leaseStart,
    endDate: payload.leaseEnd,
    rent: payload.rent,
    deposit: payload.deposit,
    paymentCycle: payload.paymentCycle,
    remark: '办理入住（模拟）',
    archive: null,
  })
  room.activeOccupancyId = occupancyId

  room.paymentSchedule = paymentSchedule
  ensureCollections(room)
  if (room.paymentSchedule.length > 0) {
    room.paymentSchedule[0].paidAmount = room.paymentSchedule[0].expectedAmount
    room.paymentSchedule[0].coveredAmount = room.paymentSchedule[0].expectedAmount
    room.paymentSchedule[0].status = PAYMENT_STATUS.PAID
    room.paymentSchedule[0].payDate = now
    room.paymentSchedule[0].receiptPic = true
    room.collections.unshift({
      id: generateId('col'),
      kind: BILL_TYPE.RENT,
      title: `房租 第${room.paymentSchedule[0].term}期`,
      amount: Number(room.paymentSchedule[0].expectedAmount || 0),
      paidAt: now,
      receiptPic: true,
      termIds: [room.paymentSchedule[0].id],
      billId: '',
      note: '入住首期收款',
      coverageLabel: `覆盖第 ${room.paymentSchedule[0].term} 期`,
    })
  }

  room.tenant = payload.tenant
  room.phone = payload.phone
  room.idCard = payload.idCard
  room.rent = payload.rent
  room.deposit = payload.deposit
  room.paymentCycle = payload.paymentCycle
  room.leaseStart = payload.leaseStart
  room.leaseEnd = payload.leaseEnd
  room.hasIdCardPic = true
  room.hasContract = true
  room.attachmentFiles = attachments
  room.status = ROOM_STATUS.RENTED

  const firstPaymentAmount = Number((payload.rent * payload.paymentCycle).toFixed(2))
  room.history.unshift({
    id: generateId('h'),
    type: 'checkin',
    date: now,
    remark: `办理入住并确认收款：${room.tenant}，首期 ￥${firstPaymentAmount}`,
  })
}

export function checkoutRoom(room, payload, { now }) {
  const nowDate = now.slice(0, 10)
  const previousTenant = room.tenant || '未知租客'

  room.occupancies = Array.isArray(room.occupancies) ? room.occupancies : []
  const activeOccupancy = room.occupancies.find((occupancy) => occupancy.status === OCCUPANCY_STATUS.ACTIVE) || null
  if (activeOccupancy) {
    activeOccupancy.status = OCCUPANCY_STATUS.COMPLETED
    activeOccupancy.endDate = nowDate
    activeOccupancy.archive = {
      bills: room.bills || [],
      meterReadings: room.meterReadings || [],
      paymentSchedule: room.paymentSchedule || [],
      collections: room.collections || [],
    }
    activeOccupancy.remark = activeOccupancy.remark || '退租归档'
  }

  room.activeOccupancyId = ''
  room.occupancies.unshift({
    id: generateId('oc_idle'),
    kind: OCCUPANCY_KIND.IDLE,
    status: OCCUPANCY_STATUS.IDLE,
    startDate: nowDate,
    endDate: '',
    remark: '退租后空置',
    archive: null,
  })

  room.status = ROOM_STATUS.EMPTY
  room.tenant = ''
  room.phone = ''
  room.idCard = ''
  room.hasIdCardPic = false
  room.hasContract = false
  room.attachmentFiles = { idCard: null, contract: null }
  room.lastWater = payload.water
  room.lastElectric = payload.electric
  room.lastGas = payload.gas ?? room.lastGas ?? 0
  room.bills = []
  room.collections = []
  room.meterReadings = []
  room.paymentSchedule = []
  room.history.unshift({
    id: generateId('h'),
    type: 'checkout',
    date: now,
    remark: `办理退租：${previousTenant}，押金应退 ￥${payload.refund}，读数 水 ${payload.water} / 电 ${payload.electric}${payload.gas !== undefined ? ` / 气 ${payload.gas}` : ''}`,
  })
}
