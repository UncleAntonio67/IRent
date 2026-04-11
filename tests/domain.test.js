import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeRoom, BILL_TYPE, PAYMENT_STATUS, ROOM_STATUS } from '../src/domain/rent-models.js'
import {
  computeCollectionSummary,
  computeMeterCharge,
  recordDirectUtilityCollection,
  recordRentCollection,
  checkoutRoom,
} from '../src/domain/rent-room-service.js'

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
