import test from 'node:test'
import assert from 'node:assert/strict'

import { createDefaultFloor, getFloorDisplayName, normalizePropertyTree, normalizeRoom, resolveRoomStatus, BILL_TYPE, PAYMENT_STATUS, ROOM_STATUS, ATTACHMENT_FILE_LIMITS, ROOM_PHOTO_LIMIT, OCCUPANCY_KIND, OCCUPANCY_STATUS } from '../src/domain/rent-models.js'
import {
  computeCollectionSummary,
  getCollectedDepositAmount,
  computeMeterCharge,
  createUtilitiesBillFromMeter,
  recordDirectUtilityCollection,
  recordRentCollection,
  checkInRoom,
  checkoutRoom,
  uploadRoomAttachment,
  uploadRoomPhoto,
  recordRoomOperation,
  undoLatestRoomOperation,
} from '../src/domain/rent-room-service.js'
import { applyQuickBuild, applyWorkbenchStructureChange, PROPERTY_LIMIT, removeWorkbenchFloor, removeWorkbenchProperty } from '../src/pages/workbench/useWorkbenchStructure.js'

function buildRoom(overrides = {}) {
  return normalizeRoom({
    roomNo: 'N301',
    status: ROOM_STATUS.RENTED,
    tenant: '张总',
    phone: '13800138000',
    rent: 3500,
    deposit: 7000,
    paymentCycle: 6,
    leaseStart: '2025-10-01',
    leaseEnd: '2026-09-30',
    lastWater: 120,
    lastElectric: 300,
    lastGas: 50,
    waterPrice: 5.5,
    electricPrice: 1.2,
    gasPrice: 3.8,
    paymentSchedule: [
      {
        id: 'term_1',
        term: 1,
        startDate: '2025-10-01',
        endDate: '2026-03-31',
        dueDate: '2025-10-01',
        expectedAmount: 21000,
        paidAmount: 0,
        coveredAmount: 0,
        status: PAYMENT_STATUS.UNPAID,
      },
      {
        id: 'term_2',
        term: 2,
        startDate: '2026-04-01',
        endDate: '2026-09-30',
        dueDate: '2026-04-01',
        expectedAmount: 21000,
        paidAmount: 0,
        coveredAmount: 0,
        status: PAYMENT_STATUS.UNPAID,
      },
    ],
    bills: [],
    collections: [],
    meterReadings: [],
    history: [],
    occupancies: [],
    ...overrides,
  })
}

test('recordRentCollection allocates amount across rent terms in order', () => {
  const room = buildRoom()

  const changed = recordRentCollection(room, {
    amount: 23000,
    now: '2026-04-11 10:00',
    note: '半年租金补款',
    receiptPicked: true,
  })

  assert.equal(changed, true)
  assert.equal(room.paymentSchedule[0].coveredAmount, 21000)
  assert.equal(room.paymentSchedule[0].status, PAYMENT_STATUS.PAID)
  assert.equal(room.paymentSchedule[1].coveredAmount, 2000)
  assert.equal(room.paymentSchedule[1].status, PAYMENT_STATUS.UNPAID)
  assert.equal(room.collections[0].kind, BILL_TYPE.RENT)
  assert.equal(room.collections[0].amount, 23000)

  const summary = computeCollectionSummary(room)
  assert.equal(summary.rent.paid, 23000)
  assert.equal(summary.rent.outstandingAmount, 19000)
})

test('recordDirectUtilityCollection creates paid utility bill and collection', () => {
  const room = buildRoom()

  const changed = recordDirectUtilityCollection(room, {
    type: BILL_TYPE.GAS,
    amount: 88.4,
    title: '2026-04 天然气',
    note: '4月天然气',
    now: '2026-04-11 10:10',
    receiptPicked: true,
  })

  assert.equal(changed, true)
  assert.equal(room.bills[0].type, BILL_TYPE.GAS)
  assert.equal(room.bills[0].status, PAYMENT_STATUS.PAID)
  assert.equal(room.collections[0].kind, BILL_TYPE.GAS)
  assert.equal(room.collections[0].amount, 88.4)
})

test('collecting metered utilities settles generated bills without creating duplicates', () => {
  const room = buildRoom()
  const meter = computeMeterCharge(room, { water: 126, electric: 325 })
  createUtilitiesBillFromMeter(room, meter, { now: '2026-04-11 10:00' })

  const outstanding = room.bills.reduce((sum, bill) => sum + bill.amount, 0)
  const changed = recordDirectUtilityCollection(room, {
    type: BILL_TYPE.WATER,
    amount: meter.waterCost,
    now: '2026-04-11 10:10',
  })

  assert.equal(changed, true)
  assert.equal(room.bills.filter((bill) => bill.type === BILL_TYPE.WATER).length, 1)
  assert.equal(room.bills.find((bill) => bill.type === BILL_TYPE.WATER).status, PAYMENT_STATUS.PAID)
  assert.equal(room.lastWater, 126)
  assert.equal(room.bills.reduce((sum, bill) => sum + bill.amount, 0), outstanding)
  assert.equal(computeCollectionSummary(room).utilities.byType.find((item) => item.type === BILL_TYPE.WATER).outstanding, 0)
})

test('utility summary accumulates metered receivables and collected amounts', () => {
  const room = buildRoom()
  let summary = computeCollectionSummary(room)
  assert.equal(summary.utilities.expected, 0)
  assert.equal(summary.utilities.paid, 0)

  const meter = computeMeterCharge(room, { water: 124 })
  createUtilitiesBillFromMeter(room, meter, { now: '2026-04-11 10:00' })
  summary = computeCollectionSummary(room)
  assert.equal(summary.utilities.expected, meter.waterCost)
  assert.equal(summary.utilities.paid, 0)

  assert.equal(recordDirectUtilityCollection(room, {
    type: BILL_TYPE.WATER,
    amount: meter.waterCost,
    now: '2026-04-11 10:10',
  }), true)
  summary = computeCollectionSummary(room)
  assert.equal(summary.utilities.expected, meter.waterCost)
  assert.equal(summary.utilities.paid, meter.waterCost)
  assert.equal(summary.utilities.outstandingAmount, 0)

  const nextMeter = computeMeterCharge(room, { water: 126 })
  createUtilitiesBillFromMeter(room, nextMeter, { now: '2026-05-11 10:00' })
  summary = computeCollectionSummary(room)
  assert.equal(summary.utilities.expected, meter.waterCost + nextMeter.waterCost)
  assert.equal(summary.utilities.paid, meter.waterCost)
  assert.equal(summary.utilities.outstandingAmount, nextMeter.waterCost)

  assert.equal(recordDirectUtilityCollection(room, {
    type: BILL_TYPE.WATER,
    amount: nextMeter.waterCost,
    now: '2026-05-11 10:10',
  }), true)
  summary = computeCollectionSummary(room)
  assert.equal(summary.utilities.expected, meter.waterCost + nextMeter.waterCost)
  assert.equal(summary.utilities.paid, meter.waterCost + nextMeter.waterCost)
  assert.equal(summary.utilities.outstandingAmount, 0)
})

test('legacy duplicate metered utility records do not remain receivable', () => {
  const room = buildRoom({
    bills: [
      { id: 'meter_water', type: BILL_TYPE.WATER, amount: 50, status: PAYMENT_STATUS.UNPAID, dueDate: '2026-04-11' },
      { id: 'legacy_water_collection', type: BILL_TYPE.WATER, amount: 50, status: PAYMENT_STATUS.PAID, dueDate: '2026-04-11' },
    ],
  })
  const summary = computeCollectionSummary(room)
  assert.equal(summary.utilities.outstandingAmount, 0)
  assert.equal(summary.utilities.byType.find((item) => item.type === BILL_TYPE.WATER).outstanding, 0)
})

test('computeMeterCharge supports water electric gas in one pass', () => {
  const room = buildRoom()
  const meter = computeMeterCharge(room, {
    water: '126.5',
    electric: '325',
    gas: '61',
  })

  assert.ok(meter)
  assert.equal(meter.waterDiff, 6.5)
  assert.equal(meter.electricDiff, 25)
  assert.equal(meter.gasDiff, 11)
  assert.equal(meter.total, 6.5 * 5.5 + 25 * 1.2 + 11 * 3.8)
})

test('checkoutRoom archives collections and clears active room business data', () => {
  const room = buildRoom({
    collections: [
      {
        id: 'col_1',
        kind: BILL_TYPE.RENT,
        title: '租金收款',
        amount: 21000,
        paidAt: '2026-04-01 10:00',
      },
    ],
    bills: [
      {
        id: 'bill_1',
        type: BILL_TYPE.WATER,
        title: '2026-04 水费',
        amount: 120,
        status: PAYMENT_STATUS.PAID,
      },
    ],
    occupancies: [
      {
        id: 'occ_1',
        kind: 'lease',
        status: 'active',
        tenant: '张总',
        startDate: '2025-10-01',
        endDate: '',
      },
    ],
  })

  checkoutRoom(
    room,
    {
      water: 130,
      electric: 340,
      gas: 66,
      refund: 5000,
    },
    { now: '2026-04-11 11:00' }
  )

  assert.equal(room.status, ROOM_STATUS.EMPTY)
  assert.equal(room.tenant, '')
  assert.equal(room.collections.length, 0)
  assert.equal(room.bills.length, 0)
  assert.equal(room.lastWater, 130)
  assert.equal(room.lastElectric, 340)
})

test('checkInRoom keeps optional attachments absent and records configured charges', () => {
  const room = normalizeRoom({ roomNo: 'A101', status: ROOM_STATUS.EMPTY })
  const schedule = [{ id: 'term_1', term: 1, expectedAmount: 6000, paidAmount: 0, coveredAmount: 0, status: PAYMENT_STATUS.UNPAID }]

  checkInRoom(room, {
    tenant: '王女士', phone: '13800138000', idCard: '', rent: 2000, deposit: 2000, paymentCycle: 3,
    leaseStart: '2026-07-01', leaseEnd: '2026-09-30', utilityChargeConfig: { water: 'separate' }, waterBase: 10, electricBase: 20,
  }, {
    now: '2026-07-01 09:00', paymentSchedule: schedule, attachments: { idCard: null, contract: null },
    initialCollectionAmount: 6000, initialReceiptPicked: false, initialDepositAmount: 2000, initialDepositReceiptPicked: false,
  })

  assert.equal(room.status, ROOM_STATUS.RENTED)
  assert.equal(room.tenant, '王女士')
  assert.equal(room.hasIdCardPic, false)
  assert.equal(room.hasContract, false)
  assert.equal(room.paymentSchedule[0].status, PAYMENT_STATUS.PAID)
  assert.equal(room.paymentSchedule[0].receiptPic, false)
  assert.equal(room.collections.length, 2)
  assert.equal(room.collections.every((item) => item.receiptPic === false), true)
  assert.equal(getCollectedDepositAmount(room), 2000)
})

test('checkout deposit is only available when a deposit collection was recorded', () => {
  const room = normalizeRoom({ roomNo: 'A103', status: ROOM_STATUS.RENTED, deposit: 1800 })
  assert.equal(getCollectedDepositAmount(room), 0)

  room.collections = [{
    id: 'deposit_1',
    kind: BILL_TYPE.CUSTOM,
    title: '押金收取',
    amount: 1800,
    coverageLabel: '押金',
  }]
  assert.equal(getCollectedDepositAmount(room), 1800)
})

test('room status follows unpaid rent due dates', () => {
  const baseRoom = {
    status: ROOM_STATUS.RENTED,
    occupancies: [{ kind: OCCUPANCY_KIND.LEASE, status: OCCUPANCY_STATUS.ACTIVE }],
  }
  assert.equal(resolveRoomStatus({ ...baseRoom, paymentSchedule: [{ dueDate: '2026-08-01', expectedAmount: 1000, coveredAmount: 0 }] }, new Date('2026-07-26')), ROOM_STATUS.DUE_SOON)
  assert.equal(resolveRoomStatus({ ...baseRoom, paymentSchedule: [{ dueDate: '2026-07-31', expectedAmount: 1000, coveredAmount: 0 }] }, new Date('2026-08-01')), ROOM_STATUS.OVERDUE)
  assert.equal(resolveRoomStatus({ ...baseRoom, paymentSchedule: [{ dueDate: '2026-08-20', expectedAmount: 1000, coveredAmount: 0 }] }, new Date('2026-08-01')), ROOM_STATUS.RENTED)
})

test('room attachments migrate single files and enforce the configured image limits', () => {
  const room = normalizeRoom({
    roomNo: 'A102',
    attachmentFiles: {
      idCard: { name: 'legacy-id.jpg' },
      contract: { name: 'legacy-contract.jpg' },
    },
  })

  assert.equal(room.attachmentFiles.idCard.length, 1)
  assert.equal(room.attachmentFiles.contract.length, 1)

  for (let index = 1; index < ATTACHMENT_FILE_LIMITS.idCard; index += 1) {
    assert.ok(uploadRoomAttachment(room, 'idCard', { now: '2026-08-01 10:00', file: { name: `id-${index}.jpg` } }))
  }
  assert.equal(uploadRoomAttachment(room, 'idCard', { now: '2026-08-01 10:00', file: { name: 'id-overflow.jpg' } }), null)

  for (let index = 0; index < ROOM_PHOTO_LIMIT; index += 1) {
    assert.ok(uploadRoomPhoto(room, { now: '2026-08-01 10:00', file: { name: `room-${index}.jpg` } }))
  }
  assert.equal(uploadRoomPhoto(room, { now: '2026-08-01 10:00', file: { name: 'room-overflow.jpg' } }), null)
})

test('room photo preserves confirmed attachment identity for later cloud deletion', () => {
  const room = buildRoom({ roomPhotos: [] })
  const photo = uploadRoomPhoto(room, {
    now: '2026-08-01 10:00',
    file: { id: 'cloud_attachment_123', clientOperationId: 'attachment_12345678', name: 'confirmed.jpg' },
  })

  assert.equal(photo.id, 'cloud_attachment_123')
  assert.equal(photo.clientOperationId, 'attachment_12345678')
  const normalized = normalizeRoom(room)
  assert.equal(normalized.roomPhotos[0].id, 'cloud_attachment_123')
  assert.equal(normalized.roomPhotos[0].clientOperationId, 'attachment_12345678')
})

test('undoLatestRoomOperation restores the room snapshot and retains an audit record', () => {
  const room = buildRoom()
  const before = JSON.parse(JSON.stringify(room))
  room.tenant = '错误租客'
  room.rent = 1
  recordRoomOperation(room, { kind: 'edit_room_info', label: '修改房间信息', now: '2026-08-01 11:00', before })

  const undone = undoLatestRoomOperation(room, { now: '2026-08-01 11:01' })
  assert.equal(undone.label, '修改房间信息')
  assert.equal(room.tenant, before.tenant)
  assert.equal(room.rent, before.rent)
  assert.equal(room.operationLog.at(-1).status, 'undone')
  assert.equal(room.history[0].type, 'undo')
})

test('structure management creates named defaults, limits properties, and removes floors', () => {
  const firstFloor = createDefaultFloor(3)
  assert.equal(firstFloor.name, '3层')
  assert.equal(firstFloor.rooms[0].roomNo, '301')
  assert.equal(getFloorDisplayName(0), 'B1')
  assert.equal(getFloorDisplayName(-1), 'B2')

  const tree = normalizePropertyTree([{ id: 'p1', name: '院落一', blocks: [] }])
  const modal = { type: 'property' }
  assert.ok(applyWorkbenchStructureChange(tree, 'p1', modal, '院落二').nextPropertyId)
  assert.ok(applyWorkbenchStructureChange(tree, 'p1', modal, '院落三').nextPropertyId)
  assert.equal(tree.length, PROPERTY_LIMIT)
  assert.equal(applyWorkbenchStructureChange(tree, 'p1', modal, '院落四').error, '最多支持创建 3 个院落')

  const removedProperty = removeWorkbenchProperty(tree, 'p1')
  assert.equal(removedProperty.removed, true)
  assert.equal(tree.some((item) => item.id === 'p1'), false)

  const secondProperty = tree.find((item) => item.name === '院落二')
  const block = secondProperty.blocks[0]
  assert.equal(removeWorkbenchFloor(tree, secondProperty.id, block.id, 1), true)
  assert.equal(block.floors.length, 0)

  const floorResult = applyWorkbenchStructureChange(tree, secondProperty.id, { type: 'floor', blockId: block.id, roomCount: '3' }, '6')
  assert.ok(floorResult.nextProperties)
  assert.deepEqual(block.floors[0].rooms.map((room) => room.roomNo), ['601', '602', '603'])

  const quickResult = applyQuickBuild(tree, secondProperty.id, {
    blockName: '独立楼', floorCount: 2, hasBasement: false,
    floorRowsReady: true,
    floorRooms: [{ floor: 2, rooms: 2 }, { floor: 1, rooms: 4 }],
  })
  assert.ok(quickResult.nextProperties)
  const quickBlock = secondProperty.blocks.at(-1)
  assert.equal(quickBlock.floors[0].rooms.length, 2)
  assert.equal(quickBlock.floors[1].rooms.length, 4)

  const basementResult = applyQuickBuild(tree, secondProperty.id, {
    blockName: '地下层楼', floorCount: 4, hasBasement: true,
    floorRowsReady: true,
    floorRooms: [{ floor: 3, rooms: 1 }, { floor: 2, rooms: 1 }, { floor: 1, rooms: 1 }, { floor: 0, rooms: 1 }],
  })
  assert.ok(basementResult.nextProperties)
  const basementBlock = secondProperty.blocks.at(-1)
  assert.deepEqual(basementBlock.floors.map((floor) => floor.name), ['3层', '2层', '1层', 'B1'])
  assert.equal(basementBlock.floors.at(-1).rooms[0].roomNo, 'B101')
})
