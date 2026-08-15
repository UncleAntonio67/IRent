function isNil(value) {
  return value === null || value === undefined
}

export function toPlainNumber(value) {
  if (isNil(value)) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (typeof value?.toNumber === 'function') {
    return value.toNumber()
  }
  if (typeof value?.toString === 'function') {
    const parsed = Number(value.toString())
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function toIsoString(value) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export function serializeAttachment(attachment) {
  return {
    id: attachment.id,
    type: attachment.type,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType || null,
    filePath: attachment.filePath || null,
    fileUrl: attachment.fileUrl || null,
    storageKey: attachment.storageKey || null,
    fileSize: attachment.fileSize || 0,
    clientOperationId: attachment.clientOperationId || null,
    uploadedAt: toIsoString(attachment.uploadedAt),
  }
}

export function serializeCollection(collection) {
  return {
    id: collection.id,
    billType: collection.billType,
    title: collection.title,
    amount: toPlainNumber(collection.amount),
    note: collection.note || null,
    coverageLabel: collection.coverageLabel || null,
    paidAt: toIsoString(collection.paidAt),
    createdAt: toIsoString(collection.createdAt),
    updatedAt: toIsoString(collection.updatedAt),
    relatedBillId: collection.relatedBillId || null,
    relatedTermId: collection.relatedTermId || null,
    attachments: Array.isArray(collection.attachments)
      ? collection.attachments.map(serializeAttachment)
      : [],
  }
}

export function serializeBill(bill) {
  return {
    id: bill.id,
    type: bill.type,
    title: bill.title,
    amount: toPlainNumber(bill.amount),
    status: bill.status,
    dueDate: toIsoString(bill.dueDate),
    paidAt: toIsoString(bill.paidAt),
    createdAt: toIsoString(bill.createdAt),
    updatedAt: toIsoString(bill.updatedAt),
    collections: Array.isArray(bill.collections) ? bill.collections.map(serializeCollection) : [],
  }
}

export function serializePaymentTerm(term) {
  return {
    id: term.id,
    termNo: term.termNo,
    startDate: toIsoString(term.startDate),
    endDate: toIsoString(term.endDate),
    dueDate: toIsoString(term.dueDate),
    expectedAmount: toPlainNumber(term.expectedAmount),
    paidAmount: toPlainNumber(term.paidAmount),
    coveredAmount: toPlainNumber(term.coveredAmount),
    status: term.status,
    paidAt: toIsoString(term.paidAt),
    createdAt: toIsoString(term.createdAt),
    updatedAt: toIsoString(term.updatedAt),
    collections: Array.isArray(term.collections) ? term.collections.map(serializeCollection) : [],
  }
}

export function serializeMeterReading(reading) {
  return {
    id: reading.id,
    waterReading: toPlainNumber(reading.waterReading),
    electricReading: toPlainNumber(reading.electricReading),
    gasReading: toPlainNumber(reading.gasReading),
    totalAmount: toPlainNumber(reading.totalAmount),
    recordedAt: toIsoString(reading.recordedAt),
    attachments: Array.isArray(reading.attachments) ? reading.attachments.map(serializeAttachment) : [],
  }
}

export function serializeOccupancy(occupancy) {
  return {
    id: occupancy.id,
    kind: occupancy.kind,
    status: occupancy.status,
    tenantName: occupancy.tenantName || null,
    phone: occupancy.phone || null,
    idCardNo: occupancy.idCardNo || null,
    rentAmount: toPlainNumber(occupancy.rentAmount),
    depositAmount: toPlainNumber(occupancy.depositAmount),
    paymentCycleMonths: occupancy.paymentCycleMonths || null,
    startDate: toIsoString(occupancy.startDate),
    endDate: toIsoString(occupancy.endDate),
    remark: occupancy.remark || null,
    archive: occupancy.archiveJson || null,
  }
}

export function serializeRoomSummary(room) {
  return {
    id: room.id,
    roomNo: room.roomNo,
    status: room.status,
    tenantName: room.tenantName || null,
    phone: room.phone || null,
    rentAmount: toPlainNumber(room.rentAmount),
    depositAmount: toPlainNumber(room.depositAmount),
    paymentCycleMonths: room.paymentCycleMonths || null,
    leaseStartDate: toIsoString(room.leaseStartDate),
    leaseEndDate: toIsoString(room.leaseEndDate),
    waterPrice: toPlainNumber(room.waterPrice),
    electricPrice: toPlainNumber(room.electricPrice),
    gasPrice: toPlainNumber(room.gasPrice),
    heatingPrice: toPlainNumber(room.heatingPrice),
    waterChargeMode: room.waterChargeMode || null,
    electricChargeMode: room.electricChargeMode || null,
    gasChargeMode: room.gasChargeMode || null,
    heatingChargeMode: room.heatingChargeMode || null,
    lastWaterReading: toPlainNumber(room.lastWaterReading),
    lastElectricReading: toPlainNumber(room.lastElectricReading),
    lastGasReading: toPlainNumber(room.lastGasReading),
  }
}

export function serializeRoomDetail(room) {
  return {
    ...serializeRoomSummary(room),
    floor: room.floor
      ? {
          id: room.floor.id,
          floorNo: room.floor.floorNo,
          block: room.floor.block
            ? {
                id: room.floor.block.id,
                name: room.floor.block.name,
                property: room.floor.block.property
                  ? {
                      id: room.floor.block.property.id,
                      name: room.floor.block.property.name,
                    }
                  : null,
              }
            : null,
        }
      : null,
    occupancies: Array.isArray(room.occupancies) ? room.occupancies.map(serializeOccupancy) : [],
    paymentTerms: Array.isArray(room.paymentTerms) ? room.paymentTerms.map(serializePaymentTerm) : [],
    bills: Array.isArray(room.bills) ? room.bills.map(serializeBill) : [],
    collections: Array.isArray(room.collections) ? room.collections.map(serializeCollection) : [],
    meterReadings: Array.isArray(room.meterReadings) ? room.meterReadings.map(serializeMeterReading) : [],
    attachments: Array.isArray(room.attachments) ? room.attachments.map(serializeAttachment) : [],
  }
}

export function serializePropertyTree(property) {
  const blocks = Array.isArray(property.blocks) ? property.blocks : []
  return {
    id: property.id,
    name: property.name,
    blockCount: blocks.length,
    floorCount: blocks.reduce((sum, block) => sum + (block.floors?.length || 0), 0),
    roomCount: blocks.reduce(
      (sum, block) => sum + (block.floors || []).reduce((acc, floor) => acc + (floor.rooms?.length || 0), 0),
      0
    ),
    blocks: blocks.map((block) => ({
      id: block.id,
      name: block.name,
      sortOrder: block.sortOrder,
      floors: (block.floors || []).map((floor) => ({
        id: floor.id,
        floorNo: floor.floorNo,
        sortOrder: floor.sortOrder,
        rooms: (floor.rooms || []).map(serializeRoomSummary),
      })),
    })),
  }
}
