export const ROOM_STATUS = {
  EMPTY: 'empty',
  RENTED: 'rented',
  DUE_SOON: 'due_soon',
  OVERDUE: 'overdue',
}

export const OCCUPANCY_KIND = {
  LEASE: 'lease',
  IDLE: 'idle',
}

export const OCCUPANCY_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  IDLE: 'idle',
}

export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  DUE_SOON: 'due_soon',
  OVERDUE: 'overdue',
}

export const BILL_TYPE = {
  RENT: 'rent',
  WATER: 'water',
  ELECTRIC: 'electric',
  GAS: 'gas',
  HEATING: 'heating',
  CUSTOM: 'custom',
}

export function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

export function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value))
}

export function normalizeAttachmentFile(file, fallbackName) {
  if (!file) return null
  return {
    name: file.name || fallbackName || 'unnamed_file',
    uploadedAt: file.uploadedAt || '',
    source: file.source || 'mock',
    previewText: file.previewText || '',
  }
}

export function normalizeRoomPhoto(photo, index = 0) {
  if (!photo) return null
  return {
    id: photo.id || generateId('photo'),
    name: photo.name || `room_photo_${index + 1}.jpg`,
    uploadedAt: photo.uploadedAt || '',
    source: photo.source || 'mock',
    previewText: photo.previewText || '',
    remark: photo.remark || '',
  }
}

export function normalizeCollectionRecord(record = {}) {
  return {
    id: record.id || generateId('col'),
    kind: record.kind || BILL_TYPE.RENT,
    title: record.title || '',
    amount: Number(record.amount || 0) || 0,
    paidAt: record.paidAt || '',
    receiptPic: Boolean(record.receiptPic),
    termIds: Array.isArray(record.termIds) ? record.termIds : [],
    billId: record.billId || '',
    note: record.note || '',
    coverageLabel: record.coverageLabel || '',
  }
}

export function normalizeOccupancy(occ = {}) {
  const rent = Number(occ.rent || 0) || 0
  const paymentCycle = Number(occ.paymentCycle || 3) || 3

  return {
    id: occ.id || generateId('oc'),
    kind: occ.kind || OCCUPANCY_KIND.LEASE,
    status: occ.status || OCCUPANCY_STATUS.COMPLETED,
    tenant: occ.tenant || '',
    phone: occ.phone || '',
    idCard: occ.idCard || '',
    startDate: occ.startDate || '',
    endDate: occ.endDate || '',
    rent,
    deposit: Number(occ.deposit || (rent ? rent : 0)) || 0,
    paymentCycle,
    remark: occ.remark || '',
    archive: occ.archive || null,
  }
}

export function normalizePaymentTerm(term = {}) {
  return {
    id: term.id || generateId('term'),
    term: Number(term.term || 1) || 1,
    startDate: term.startDate || '',
    endDate: term.endDate || '',
    dueDate: term.dueDate || term.startDate || '',
    expectedAmount: Number(term.expectedAmount || 0) || 0,
    paidAmount: Number(term.paidAmount || 0) || 0,
    coveredAmount: Number(term.coveredAmount || term.paidAmount || 0) || 0,
    payDate: term.payDate || '',
    receiptPic: Boolean(term.receiptPic),
    status: term.status || PAYMENT_STATUS.UNPAID,
  }
}

export function createDefaultRoom(roomNo = '101') {
  return normalizeRoom({
    id: generateId('r'),
    roomNo,
    status: ROOM_STATUS.EMPTY,
    tenant: '',
    rent: 1800,
  })
}

export function normalizeRoom(room = {}) {
  const rent = Number(room.rent || 0) || 0
  const paymentCycle = Number(room.paymentCycle || 3) || 3
  const normalized = {
    id: room.id || generateId('r'),
    roomNo: room.roomNo || '000',
    status: room.status || ROOM_STATUS.EMPTY,
    tenant: room.tenant || '',
    phone: room.phone || '',
    idCard: room.idCard || '',
    rent,
    deposit: Number(room.deposit || (rent ? rent : 0)) || 0,
    paymentCycle,
    nextDueDate: room.nextDueDate || '',
    nextDueAmount: Number(room.nextDueAmount || 0) || 0,
    hasIdCardPic: Boolean(room.hasIdCardPic),
    hasContract: Boolean(room.hasContract),
    attachmentFiles: {
      idCard: normalizeAttachmentFile(room.attachmentFiles?.idCard, 'id_card.jpg'),
      contract: normalizeAttachmentFile(room.attachmentFiles?.contract, 'lease_contract.pdf'),
    },
    roomPhotos: Array.isArray(room.roomPhotos) ? room.roomPhotos.map(normalizeRoomPhoto).filter(Boolean) : [],
    leaseStart: room.leaseStart || '',
    leaseEnd: room.leaseEnd || '',
    lastWater: Number(room.lastWater || 0) || 0,
    lastElectric: Number(room.lastElectric || 0) || 0,
    lastGas: Number(room.lastGas || 0) || 0,
    waterPrice: Number(room.waterPrice || 5.5) || 5.5,
    electricPrice: Number(room.electricPrice || 1.2) || 1.2,
    gasPrice: Number(room.gasPrice || 3.8) || 3.8,
    heatingPrice: Number(room.heatingPrice || 0) || 0,
    bills: Array.isArray(room.bills) ? room.bills : [],
    collections: Array.isArray(room.collections) ? room.collections.map(normalizeCollectionRecord) : [],
    meterReadings: Array.isArray(room.meterReadings) ? room.meterReadings : [],
    history: Array.isArray(room.history) ? room.history : [],
    occupancies: Array.isArray(room.occupancies) ? room.occupancies.map(normalizeOccupancy) : [],
    activeOccupancyId: room.activeOccupancyId || '',
    paymentSchedule: Array.isArray(room.paymentSchedule) ? room.paymentSchedule.map(normalizePaymentTerm) : [],
  }

  if (normalized.occupancies.length === 0) {
    if (normalized.status === ROOM_STATUS.EMPTY) {
      normalized.occupancies = [
        normalizeOccupancy({
          kind: OCCUPANCY_KIND.IDLE,
          status: OCCUPANCY_STATUS.IDLE,
          startDate: '',
          endDate: '',
          remark: '当前空置',
        }),
      ]
    } else {
      normalized.occupancies = [
        normalizeOccupancy({
          kind: OCCUPANCY_KIND.LEASE,
          status: OCCUPANCY_STATUS.ACTIVE,
          tenant: normalized.tenant,
          phone: normalized.phone,
          idCard: normalized.idCard,
          startDate: normalized.leaseStart,
          endDate: normalized.leaseEnd,
          rent: normalized.rent,
          deposit: normalized.deposit,
          paymentCycle: normalized.paymentCycle,
          remark: '当前租约',
        }),
      ]
    }
  }

  if (!normalized.activeOccupancyId) {
    const active = normalized.occupancies.find((occupancy) => occupancy.status === OCCUPANCY_STATUS.ACTIVE)
    normalized.activeOccupancyId = active?.id || ''
  }

  return normalized
}

export function normalizePropertyTree(tree = []) {
  return tree.map((property) => ({
    id: property.id || generateId('p'),
    name: property.name || '未命名院落',
    blocks: (property.blocks || []).map((block) => ({
      id: block.id || generateId('b'),
      name: block.name || '未命名楼栋',
      floors: (block.floors || [])
        .map((floorItem) => ({
          floor: Number(floorItem.floor || 1) || 1,
          rooms: (floorItem.rooms || []).map(normalizeRoom),
        }))
        .sort((a, b) => b.floor - a.floor),
    })),
  }))
}

export function getRoomStatusLabel(status) {
  switch (status) {
    case ROOM_STATUS.OVERDUE:
      return '欠费未收'
    case ROOM_STATUS.DUE_SOON:
      return '待收款'
    case ROOM_STATUS.RENTED:
      return '已租'
    case ROOM_STATUS.EMPTY:
    default:
      return '空置'
  }
}

export function getPaymentCycleLabel(cycle) {
  const value = Number(cycle || 0)
  if (value === 1) return '月付'
  if (value === 3) return '季付'
  if (value === 6) return '半年付'
  if (value === 12) return '年付'
  return `${value}个月`
}

export function formatShortDate(iso) {
  const text = String(iso || '').trim()
  if (!text) return '-'
  return text.replace(/-/g, '.')
}
