function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function toPropertyRecord(property) {
  return {
    id: property.id,
    name: property.name,
    created_at: property.createdAt || null,
  }
}

export function toBlockRecord(block, propertyId) {
  return {
    id: block.id,
    property_id: propertyId,
    name: block.name,
  }
}

export function toRoomRecord(room, blockId, floor) {
  return {
    id: room.id,
    block_id: blockId,
    floor,
    room_no: room.roomNo,
    status: room.status,
    rent_price: toNumber(room.rent),
    water_price: toNumber(room.waterPrice, 5.5),
    electric_price: toNumber(room.electricPrice, 1.2),
  }
}

export function toLeaseRecord(room) {
  const activeLease = (room.occupancies || []).find((occupancy) => occupancy.id === room.activeOccupancyId) || null
  if (!activeLease) return null

  return {
    id: activeLease.id,
    room_id: room.id,
    tenant_name: activeLease.tenant || room.tenant || '',
    phone: activeLease.phone || room.phone || '',
    id_card: activeLease.idCard || room.idCard || '',
    start_date: activeLease.startDate || room.leaseStart || '',
    end_date: activeLease.endDate || room.leaseEnd || '',
    deposit: toNumber(activeLease.deposit, room.deposit),
    payment_cycle: toNumber(activeLease.paymentCycle, room.paymentCycle),
    utils_included: false,
    id_card_pic: room.attachmentFiles?.idCard?.name || '',
    contract_pic: room.attachmentFiles?.contract?.name || '',
  }
}

export function toMeterReadingRecord(meterReading, roomId) {
  return {
    id: meterReading.id,
    room_id: roomId,
    date: meterReading.date,
    water_read: toNumber(meterReading.waterRead),
    electric_read: toNumber(meterReading.electricRead),
    total_amount: toNumber(meterReading.total),
    bill_id: meterReading.billId || '',
  }
}

export function toBillRecord(bill, roomId, leaseId = '') {
  return {
    id: bill.id,
    room_id: roomId,
    lease_id: leaseId,
    title: bill.title,
    type: bill.type,
    amount: toNumber(bill.amount),
    status: bill.status,
    due_date: bill.dueDate || '',
    pay_date: bill.payDate || '',
    receipt_pic: Boolean(bill.receiptPic),
  }
}

export function toRoomAggregatePayload({ property, block, floor, room }) {
  const lease = toLeaseRecord(room)
  const leaseId = lease?.id || ''

  return {
    property: toPropertyRecord(property),
    block: toBlockRecord(block, property.id),
    room: toRoomRecord(room, block.id, floor),
    lease,
    bills: (room.bills || []).map((bill) => toBillRecord(bill, room.id, leaseId)),
    meterReadings: (room.meterReadings || []).map((meterReading) => toMeterReadingRecord(meterReading, room.id)),
  }
}
