function lower(value) {
  return String(value || '').trim().toLowerCase()
}

function mapRoomStatus(status) {
  const value = lower(status)
  if (value === 'empty') return 'empty'
  if (value === 'overdue') return 'overdue'
  if (value === 'due_soon') return 'due_soon'
  return 'rented'
}

function mapChargeMode(mode) {
  return lower(mode) === 'included' ? 'included' : 'separate'
}

function mapBillType(type) {
  const value = lower(type)
  if (['rent', 'water', 'electric', 'gas', 'heating'].includes(value)) return value
  return 'custom'
}

function toDisplayDate(value) {
  if (!value) return ''
  const iso = String(value)
  return iso.includes('T') ? iso.replace('T', ' ').slice(0, 16) : iso
}

export function mapServerAttachmentFile(file) {
  if (!file) return null
  return {
    id: file.id || '',
    name: file.fileName || 'attachment',
    uploadedAt: toDisplayDate(file.uploadedAt),
    source: 'cloud',
    previewText: '',
    filePath: file.fileUrl || file.filePath || '',
    url: file.fileUrl || file.filePath || '',
    size: Number(file.fileSize || 0) || 0,
    mimeType: file.mimeType || '',
  }
}

export function mapServerRoomSummary(room) {
  return {
    id: room.id,
    roomNo: room.roomNo || '',
    status: mapRoomStatus(room.status),
    tenant: room.tenantName || '',
    phone: room.phone || '',
    idCard: '',
    rent: Number(room.rentAmount || 0) || 0,
    deposit: Number(room.depositAmount || 0) || 0,
    paymentCycle: Number(room.paymentCycleMonths || 0) || 0,
    leaseStart: room.leaseStartDate ? String(room.leaseStartDate).slice(0, 10) : '',
    leaseEnd: room.leaseEndDate ? String(room.leaseEndDate).slice(0, 10) : '',
    lastWater: Number(room.lastWaterReading || 0) || 0,
    lastElectric: Number(room.lastElectricReading || 0) || 0,
    lastGas: Number(room.lastGasReading || 0) || 0,
    waterPrice: Number(room.waterPrice || 0) || 5.5,
    electricPrice: Number(room.electricPrice || 0) || 1.2,
    gasPrice: Number(room.gasPrice || 0) || 3.8,
    heatingPrice: Number(room.heatingPrice || 0) || 0,
    utilityChargeConfig: {
      water: mapChargeMode(room.waterChargeMode),
      electric: mapChargeMode(room.electricChargeMode),
      gas: mapChargeMode(room.gasChargeMode),
      heating: mapChargeMode(room.heatingChargeMode),
    },
  }
}

export function mapServerPropertyTree(properties) {
  return (properties || []).map((property) => ({
    id: property.id,
    name: property.name || '未命名院落',
    blocks: (property.blocks || []).map((block) => ({
      id: block.id,
      name: block.name || '未命名楼栋',
      floors: (block.floors || []).map((floor) => ({
        floor: Number(floor.floorNo || floor.floor || 1) || 1,
        rooms: (floor.rooms || []).map(mapServerRoomSummary),
      })),
    })),
  }))
}

export function mapServerFullPropertySnapshot(properties) {
  return (properties || []).map((property) => ({
    id: property.id,
    name: property.name || '未命名院落',
    blocks: (property.blocks || []).map((block) => ({
      id: block.id,
      name: block.name || '未命名楼栋',
      floors: (block.floors || []).map((floor) => ({
        id: floor.id,
        floor: Number(floor.floorNo || floor.floor || 1) || 1,
        name: floor.name || '',
        rooms: (floor.rooms || []).map(mapServerRoomDetail),
      })),
    })),
  }))
}

export function mapServerRoomDetail(room) {
  const attachments = Array.isArray(room.attachments) ? room.attachments : []
  const attachmentsByType = (type) => attachments.filter((item) => lower(item.type) === type)
  const attachmentByType = (type) => attachmentsByType(type)[0] || null

  const paymentSchedule = (room.paymentTerms || []).map((term) => ({
    id: term.id,
    term: Number(term.termNo || 0) || 1,
    startDate: term.startDate ? String(term.startDate).slice(0, 10) : '',
    endDate: term.endDate ? String(term.endDate).slice(0, 10) : '',
    dueDate: term.dueDate ? String(term.dueDate).slice(0, 10) : '',
    expectedAmount: Number(term.expectedAmount || 0) || 0,
    paidAmount: Number(term.paidAmount || 0) || 0,
    coveredAmount: Number(term.coveredAmount || 0) || 0,
    payDate: toDisplayDate(term.paidAt),
    receiptPic: (term.collections || []).some((item) => (item.attachments || []).length > 0),
    status: lower(term.status || 'unpaid'),
    receiptFile: null,
  }))

  const collections = (room.collections || []).map((item) => ({
    id: item.id,
    kind: mapBillType(item.billType),
    title: item.title || '',
    amount: Number(item.amount || 0) || 0,
    paidAt: toDisplayDate(item.paidAt),
    receiptPic: (item.attachments || []).length > 0,
    termIds: item.relatedTermId ? [item.relatedTermId] : [],
    billId: item.relatedBillId || '',
    note: item.note || '',
    coverageLabel: item.coverageLabel || '',
    receiptFile: mapServerAttachmentFile((item.attachments || [])[0] || null),
  }))

  const bills = (room.bills || []).map((bill) => ({
    id: bill.id,
    title: bill.title || '',
    type: mapBillType(bill.type),
    amount: Number(bill.amount || 0) || 0,
    status: lower(bill.status || 'unpaid') === 'paid' ? 'paid' : 'unpaid',
    dueDate: bill.dueDate ? String(bill.dueDate).slice(0, 10) : '',
    payDate: toDisplayDate(bill.paidAt),
    receiptPic: (bill.collections || []).some((item) => (item.attachments || []).length > 0),
  }))

  const meterReadings = (room.meterReadings || []).map((reading) => ({
    id: reading.id,
    date: reading.recordedAt ? String(reading.recordedAt).slice(0, 10) : '',
    waterRead: Number(reading.waterReading || 0) || 0,
    electricRead: Number(reading.electricReading || 0) || 0,
    gasRead: Number(reading.gasReading || 0) || 0,
    total: Number(reading.totalAmount || 0) || 0,
    billId: reading.billId || '',
  }))

  const occupancies = (room.occupancies || []).map((item) => ({
    id: item.id,
    kind: lower(item.kind || 'lease'),
    status: lower(item.status || 'completed'),
    tenant: item.tenantName || '',
    phone: item.phone || '',
    idCard: item.idCardNo || '',
    startDate: item.startDate ? String(item.startDate).slice(0, 10) : '',
    endDate: item.endDate ? String(item.endDate).slice(0, 10) : '',
    rent: Number(item.rentAmount || 0) || 0,
    deposit: Number(item.depositAmount || 0) || 0,
    paymentCycle: Number(item.paymentCycleMonths || 0) || 0,
    remark: item.remark || '',
    archive: item.archive || null,
  }))

  const summary = mapServerRoomSummary(room)
  const activeOccupancy = occupancies.find((item) => item.status === 'active')
  const firstPending = paymentSchedule.find((term) => Number(term.expectedAmount || 0) > Number(term.coveredAmount || term.paidAmount || 0))

  return {
    ...summary,
    idCard: room.idCardNo || '',
    hasIdCardPic: Boolean(attachmentByType('id_card')),
    hasContract: Boolean(attachmentByType('contract')),
    attachmentFiles: {
      idCard: attachmentsByType('id_card').map(mapServerAttachmentFile).filter(Boolean),
      contract: attachmentsByType('contract').map(mapServerAttachmentFile).filter(Boolean),
    },
    roomPhotos: attachments
      .filter((item) => lower(item.type) === 'room_photo')
      .map((item) => ({
        id: item.id,
        name: item.fileName || 'room_photo.jpg',
        uploadedAt: toDisplayDate(item.uploadedAt),
        source: 'cloud',
        previewText: '',
        filePath: item.fileUrl || item.filePath || '',
        url: item.fileUrl || item.filePath || '',
        size: Number(item.fileSize || 0) || 0,
        mimeType: item.mimeType || '',
        remark: '',
      })),
    paymentSchedule,
    bills,
    collections,
    meterReadings,
    occupancies,
    activeOccupancyId: activeOccupancy?.id || '',
    history: [],
    nextDueDate: firstPending?.dueDate || '',
    nextDueAmount: firstPending
      ? Math.max(0, Number(firstPending.expectedAmount || 0) - Number(firstPending.coveredAmount || firstPending.paidAmount || 0))
      : 0,
  }
}
