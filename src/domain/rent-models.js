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

export const ROOM_PHOTO_LIMIT = 9
export const ATTACHMENT_FILE_LIMITS = {
  idCard: 2,
  contract: 3,
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
    id: file.id || '',
    name: file.name || fallbackName || 'unnamed_file',
    uploadedAt: file.uploadedAt || '',
    source: file.source || 'local',
    previewText: file.previewText || '',
    filePath: file.filePath || file.url || '',
    url: file.url || file.filePath || '',
    size: Number(file.size || 0) || 0,
    mimeType: file.mimeType || '',
  }
}

export function normalizeAttachmentFileList(files, fallbackName, limit = 1) {
  const source = Array.isArray(files) ? files : (files ? [files] : [])
  return source
    .map((file) => normalizeAttachmentFile(file, fallbackName))
    .filter(Boolean)
    .slice(0, Math.max(0, Number(limit) || 0))
}

export function normalizeRoomPhoto(photo, index = 0) {
  if (!photo) return null
  return {
    id: photo.id || generateId('photo'),
    name: photo.name || `room_photo_${index + 1}.jpg`,
    uploadedAt: photo.uploadedAt || '',
    source: photo.source || 'local',
    previewText: photo.previewText || '',
    filePath: photo.filePath || photo.url || '',
    url: photo.url || photo.filePath || '',
    size: Number(photo.size || 0) || 0,
    mimeType: photo.mimeType || '',
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
    receiptFile: normalizeAttachmentFile(record.receiptFile, 'receipt.jpg'),
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
    attachmentFiles: {
      idCard: normalizeAttachmentFileList(occ.attachmentFiles?.idCard, 'id_card.jpg', ATTACHMENT_FILE_LIMITS.idCard),
      contract: normalizeAttachmentFileList(occ.attachmentFiles?.contract, 'lease_contract.pdf', ATTACHMENT_FILE_LIMITS.contract),
    },
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
    receiptFile: normalizeAttachmentFile(term.receiptFile, 'receipt.jpg'),
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

export function getFloorDisplayName(floor) {
  const floorNumber = Number(floor)
  if (!Number.isFinite(floorNumber)) return '1层'
  return floorNumber <= 0 ? `B${Math.abs(floorNumber) + 1}` : `${floorNumber}层`
}

export function getDefaultRoomNo(floor, roomIndex = 1) {
  const floorNumber = Number(floor)
  const suffix = String(Math.max(1, Number(roomIndex) || 1)).padStart(2, '0')
  if (!Number.isFinite(floorNumber)) return `101`
  return floorNumber <= 0 ? `B${Math.abs(floorNumber) + 1}${suffix}` : `${floorNumber}${suffix}`
}

export function resolveRoomStatus(room, now = new Date()) {
  if (room?.status === ROOM_STATUS.EMPTY) return ROOM_STATUS.EMPTY
  const activeLease = (room?.occupancies || []).some((item) => item.status === OCCUPANCY_STATUS.ACTIVE && item.kind === OCCUPANCY_KIND.LEASE)
  if (!activeLease) return ROOM_STATUS.EMPTY

  const pendingTerms = (room?.paymentSchedule || []).filter((term) => {
    const expected = Number(term.expectedAmount || 0)
    const covered = Number(term.coveredAmount ?? term.paidAmount ?? 0)
    return expected > covered
  })
  if (pendingTerms.length === 0) return ROOM_STATUS.RENTED

  const today = formatStatusDate(now)
  const dueSoonEnd = formatStatusDate(new Date(new Date(now).setDate(new Date(now).getDate() + 7)))
  if (pendingTerms.some((term) => String(term.dueDate || '') < today)) return ROOM_STATUS.OVERDUE
  if (pendingTerms.some((term) => {
    const dueDate = String(term.dueDate || '')
    return dueDate >= today && dueDate <= dueSoonEnd
  })) return ROOM_STATUS.DUE_SOON
  return ROOM_STATUS.RENTED
}

function formatStatusDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function createDefaultFloor(floor = 1) {
  const rawFloor = Number(floor)
  const floorNumber = Number.isFinite(rawFloor) ? Math.trunc(rawFloor) : 1
  return {
    floor: floorNumber,
    name: getFloorDisplayName(floorNumber),
    rooms: [createDefaultRoom(getDefaultRoomNo(floorNumber))],
  }
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
      idCard: normalizeAttachmentFileList(room.attachmentFiles?.idCard, 'id_card.jpg', ATTACHMENT_FILE_LIMITS.idCard),
      contract: normalizeAttachmentFileList(room.attachmentFiles?.contract, 'lease_contract.jpg', ATTACHMENT_FILE_LIMITS.contract),
    },
    roomPhotos: Array.isArray(room.roomPhotos) ? room.roomPhotos.map(normalizeRoomPhoto).filter(Boolean).slice(0, ROOM_PHOTO_LIMIT) : [],
    leaseStart: room.leaseStart || '',
    leaseEnd: room.leaseEnd || '',
    lastWater: Number(room.lastWater || 0) || 0,
    lastElectric: Number(room.lastElectric || 0) || 0,
    lastGas: Number(room.lastGas || 0) || 0,
    waterPrice: Number(room.waterPrice || 5.5) || 5.5,
    electricPrice: Number(room.electricPrice || 1.2) || 1.2,
    gasPrice: Number(room.gasPrice || 3.8) || 3.8,
    heatingPrice: Number(room.heatingPrice || 0) || 0,
    utilityChargeConfig: {
      water: room.utilityChargeConfig?.water || 'separate',
      electric: room.utilityChargeConfig?.electric || 'separate',
      gas: room.utilityChargeConfig?.gas || 'separate',
      heating: room.utilityChargeConfig?.heating || 'separate',
    },
    bills: Array.isArray(room.bills) ? room.bills : [],
    collections: Array.isArray(room.collections) ? room.collections.map(normalizeCollectionRecord) : [],
    meterReadings: Array.isArray(room.meterReadings) ? room.meterReadings : [],
    history: Array.isArray(room.history) ? room.history : [],
    operationLog: Array.isArray(room.operationLog) ? room.operationLog : [],
    occupancies: Array.isArray(room.occupancies) ? room.occupancies.map(normalizeOccupancy) : [],
    activeOccupancyId: room.activeOccupancyId || '',
    paymentSchedule: Array.isArray(room.paymentSchedule) ? room.paymentSchedule.map(normalizePaymentTerm) : [],
  }

  normalized.hasIdCardPic = normalized.attachmentFiles.idCard.length > 0 || normalized.hasIdCardPic
  normalized.hasContract = normalized.attachmentFiles.contract.length > 0 || normalized.hasContract

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

  normalized.status = resolveRoomStatus(normalized)

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
        .map((floorItem) => {
          const rawFloor = Number(floorItem.floor)
          const floor = Number.isFinite(rawFloor) ? Math.trunc(rawFloor) : 1
          return {
           floor,
           name: floorItem.name || getFloorDisplayName(floor),
          rooms: (floorItem.rooms || []).map(normalizeRoom),
          }
        })
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
