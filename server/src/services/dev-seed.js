import { prisma } from '../db.js'

function at(dateString) {
  return new Date(dateString)
}

async function resetTenantData(tx, tenantId) {
  await tx.exportTask.deleteMany({ where: { tenantId } })
  await tx.operationLog.deleteMany({ where: { tenantId } })
  await tx.attachment.deleteMany({ where: { tenantId } })
  await tx.property.deleteMany({ where: { tenantId } })
}

async function createRoomWithDetails(tx, floorId, room) {
  return tx.room.create({
    data: {
      floorId,
      roomNo: room.roomNo,
      status: room.status,
      tenantName: room.tenantName || null,
      phone: room.phone || null,
      idCardNo: room.idCardNo || null,
      rentAmount: room.rentAmount ?? null,
      depositAmount: room.depositAmount ?? null,
      paymentCycleMonths: room.paymentCycleMonths ?? null,
      leaseStartDate: room.leaseStartDate ? at(room.leaseStartDate) : null,
      leaseEndDate: room.leaseEndDate ? at(room.leaseEndDate) : null,
      waterPrice: room.waterPrice ?? 5.5,
      electricPrice: room.electricPrice ?? 1.2,
      gasPrice: room.gasPrice ?? 2.4,
      heatingPrice: room.heatingPrice ?? 1200,
      waterChargeMode: room.waterChargeMode ?? 'SEPARATE',
      electricChargeMode: room.electricChargeMode ?? 'SEPARATE',
      gasChargeMode: room.gasChargeMode ?? 'INCLUDED',
      heatingChargeMode: room.heatingChargeMode ?? 'INCLUDED',
      lastWaterReading: room.lastWaterReading ?? 0,
      lastElectricReading: room.lastElectricReading ?? 0,
      lastGasReading: room.lastGasReading ?? 0,
      occupancies: room.occupancies?.length
        ? {
            create: room.occupancies.map((item) => ({
              kind: item.kind,
              status: item.status,
              tenantName: item.tenantName ?? null,
              phone: item.phone ?? null,
              idCardNo: item.idCardNo ?? null,
              rentAmount: item.rentAmount ?? null,
              depositAmount: item.depositAmount ?? null,
              paymentCycleMonths: item.paymentCycleMonths ?? null,
              startDate: item.startDate ? at(item.startDate) : null,
              endDate: item.endDate ? at(item.endDate) : null,
              remark: item.remark ?? null,
            })),
          }
        : undefined,
      paymentTerms: room.paymentTerms?.length
        ? {
            create: room.paymentTerms.map((item) => ({
              termNo: item.termNo,
              startDate: at(item.startDate),
              endDate: at(item.endDate),
              dueDate: at(item.dueDate),
              expectedAmount: item.expectedAmount,
              paidAmount: item.paidAmount ?? 0,
              coveredAmount: item.coveredAmount ?? item.paidAmount ?? 0,
              status: item.status,
              paidAt: item.paidAt ? at(item.paidAt) : null,
            })),
          }
        : undefined,
      bills: room.bills?.length
        ? {
            create: room.bills.map((item) => ({
              type: item.type,
              title: item.title,
              amount: item.amount,
              status: item.status,
              dueDate: item.dueDate ? at(item.dueDate) : null,
              paidAt: item.paidAt ? at(item.paidAt) : null,
            })),
          }
        : undefined,
      meterReadings: room.meterReadings?.length
        ? {
            create: room.meterReadings.map((item) => ({
              waterReading: item.waterReading ?? null,
              electricReading: item.electricReading ?? null,
              gasReading: item.gasReading ?? null,
              totalAmount: item.totalAmount ?? null,
              recordedAt: at(item.recordedAt),
            })),
          }
        : undefined,
    },
    include: {
      paymentTerms: true,
    },
  })
}

export async function seedTenantDemoData({ tenantId, userId }) {
  return prisma.$transaction(async (tx) => {
    await resetTenantData(tx, tenantId)

    const propertyA = await tx.property.create({
      data: { tenantId, name: '江南别院（高端）' },
    })
    const propertyB = await tx.property.create({
      data: { tenantId, name: '城西青年公寓' },
    })

    const northBlock = await tx.block.create({
      data: { propertyId: propertyA.id, name: '北房主楼', sortOrder: 1 },
    })
    const southBlock = await tx.block.create({
      data: { propertyId: propertyA.id, name: '南区公寓 A 栋', sortOrder: 2 },
    })
    const youthBlock = await tx.block.create({
      data: { propertyId: propertyB.id, name: '1 号楼', sortOrder: 1 },
    })

    const [north3, north2, south5, youth6] = await Promise.all([
      tx.floor.create({ data: { blockId: northBlock.id, floorNo: 3, sortOrder: 1 } }),
      tx.floor.create({ data: { blockId: northBlock.id, floorNo: 2, sortOrder: 2 } }),
      tx.floor.create({ data: { blockId: southBlock.id, floorNo: 5, sortOrder: 1 } }),
      tx.floor.create({ data: { blockId: youthBlock.id, floorNo: 6, sortOrder: 1 } }),
    ])

    const created = {}
    const roomDefs = [
      {
        floorId: north3.id,
        roomNo: 'N301',
        status: 'DUE_SOON',
        tenantName: '张总',
        phone: '13800138000',
        idCardNo: '310101198901010011',
        rentAmount: 3500,
        depositAmount: 7000,
        paymentCycleMonths: 6,
        leaseStartDate: '2025-10-01T00:00:00.000Z',
        leaseEndDate: '2026-09-30T00:00:00.000Z',
        lastWaterReading: 220.5,
        lastElectricReading: 845,
        occupancies: [
          {
            kind: 'LEASE',
            status: 'ACTIVE',
            tenantName: '张总',
            phone: '13800138000',
            idCardNo: '310101198901010011',
            rentAmount: 3500,
            depositAmount: 7000,
            paymentCycleMonths: 6,
            startDate: '2025-10-01T00:00:00.000Z',
            endDate: '2026-09-30T00:00:00.000Z',
            remark: '当前在租，资料齐全',
          },
        ],
        paymentTerms: [
          {
            termNo: 1,
            startDate: '2025-10-01T00:00:00.000Z',
            endDate: '2026-03-31T00:00:00.000Z',
            dueDate: '2025-10-01T00:00:00.000Z',
            expectedAmount: 21000,
            paidAmount: 21000,
            status: 'PAID',
            paidAt: '2025-10-01T10:00:00.000Z',
          },
          {
            termNo: 2,
            startDate: '2026-04-01T00:00:00.000Z',
            endDate: '2026-09-30T00:00:00.000Z',
            dueDate: '2026-04-01T00:00:00.000Z',
            expectedAmount: 21000,
            paidAmount: 0,
            status: 'DUE_SOON',
          },
        ],
      },
      {
        floorId: north3.id,
        roomNo: 'N302',
        status: 'EMPTY',
        rentAmount: 3200,
        depositAmount: 3200,
        paymentCycleMonths: 3,
        lastWaterReading: 150,
        lastElectricReading: 500,
        occupancies: [
          {
            kind: 'LEASE',
            status: 'COMPLETED',
            tenantName: '林女士',
            phone: '13700000000',
            rentAmount: 3000,
            depositAmount: 6000,
            paymentCycleMonths: 3,
            startDate: '2025-02-15T00:00:00.000Z',
            endDate: '2026-02-14T00:00:00.000Z',
            remark: '上一任租客正常退租',
          },
          {
            kind: 'IDLE',
            status: 'IDLE',
            startDate: '2026-02-15T00:00:00.000Z',
            remark: '当前空置待入住',
          },
        ],
      },
      {
        floorId: north3.id,
        roomNo: 'N303',
        status: 'RENTED',
        tenantName: '陈先生',
        phone: '13911112222',
        idCardNo: '320101198710103456',
        rentAmount: 3400,
        depositAmount: 6800,
        paymentCycleMonths: 6,
        leaseStartDate: '2025-10-01T00:00:00.000Z',
        leaseEndDate: '2026-09-30T00:00:00.000Z',
        lastWaterReading: 138.4,
        lastElectricReading: 622,
        occupancies: [
          {
            kind: 'LEASE',
            status: 'ACTIVE',
            tenantName: '陈先生',
            phone: '13911112222',
            idCardNo: '320101198710103456',
            rentAmount: 3400,
            depositAmount: 6800,
            paymentCycleMonths: 6,
            startDate: '2025-10-01T00:00:00.000Z',
            endDate: '2026-09-30T00:00:00.000Z',
            remark: '按约半年付，资料完整',
          },
        ],
        paymentTerms: [
          {
            termNo: 1,
            startDate: '2025-10-01T00:00:00.000Z',
            endDate: '2026-03-31T00:00:00.000Z',
            dueDate: '2025-10-01T00:00:00.000Z',
            expectedAmount: 20400,
            paidAmount: 20400,
            status: 'PAID',
            paidAt: '2025-10-01T09:36:00.000Z',
          },
          {
            termNo: 2,
            startDate: '2026-04-01T00:00:00.000Z',
            endDate: '2026-09-30T00:00:00.000Z',
            dueDate: '2026-04-01T00:00:00.000Z',
            expectedAmount: 20400,
            paidAmount: 0,
            status: 'UNPAID',
          },
        ],
        bills: [
          {
            type: 'WATER',
            title: '2026-03 水费',
            amount: 66.0,
            status: 'PAID',
            dueDate: '2026-03-31T00:00:00.000Z',
            paidAt: '2026-04-01T20:16:00.000Z',
          },
          {
            type: 'ELECTRIC',
            title: '2026-03 电费',
            amount: 120.5,
            status: 'PAID',
            dueDate: '2026-03-31T00:00:00.000Z',
            paidAt: '2026-04-01T20:16:00.000Z',
          },
        ],
        meterReadings: [
          {
            waterReading: 138.4,
            electricReading: 622,
            totalAmount: 186.5,
            recordedAt: '2026-03-31T18:12:00.000Z',
          },
        ],
      },
      {
        floorId: north3.id,
        roomNo: 'N304',
        status: 'OVERDUE',
        tenantName: '赵女士',
        phone: '13688887777',
        idCardNo: '430101199211123456',
        rentAmount: 3600,
        depositAmount: 7200,
        paymentCycleMonths: 3,
        leaseStartDate: '2026-01-01T00:00:00.000Z',
        leaseEndDate: '2026-12-31T00:00:00.000Z',
        occupancies: [
          {
            kind: 'LEASE',
            status: 'ACTIVE',
            tenantName: '赵女士',
            phone: '13688887777',
            idCardNo: '430101199211123456',
            rentAmount: 3600,
            depositAmount: 7200,
            paymentCycleMonths: 3,
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-12-31T00:00:00.000Z',
            remark: '存在欠费',
          },
        ],
        paymentTerms: [
          {
            termNo: 1,
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-03-31T00:00:00.000Z',
            dueDate: '2026-01-01T00:00:00.000Z',
            expectedAmount: 10800,
            paidAmount: 10800,
            status: 'PAID',
            paidAt: '2026-01-01T11:02:00.000Z',
          },
          {
            termNo: 2,
            startDate: '2026-04-01T00:00:00.000Z',
            endDate: '2026-06-30T00:00:00.000Z',
            dueDate: '2026-04-01T00:00:00.000Z',
            expectedAmount: 10800,
            paidAmount: 0,
            status: 'OVERDUE',
          },
        ],
      },
      {
        floorId: north2.id,
        roomNo: 'N201',
        status: 'OVERDUE',
        tenantName: '李女士',
        phone: '13566665555',
        idCardNo: '320101198811224433',
        rentAmount: 2800,
        depositAmount: 5600,
        paymentCycleMonths: 3,
        leaseStartDate: '2025-11-01T00:00:00.000Z',
        leaseEndDate: '2026-10-31T00:00:00.000Z',
        occupancies: [
          {
            kind: 'LEASE',
            status: 'ACTIVE',
            tenantName: '李女士',
            phone: '13566665555',
            idCardNo: '320101198811224433',
            rentAmount: 2800,
            depositAmount: 5600,
            paymentCycleMonths: 3,
            startDate: '2025-11-01T00:00:00.000Z',
            endDate: '2026-10-31T00:00:00.000Z',
            remark: '当前房租存在欠费',
          },
        ],
        paymentTerms: [
          {
            termNo: 1,
            startDate: '2025-11-01T00:00:00.000Z',
            endDate: '2026-01-31T00:00:00.000Z',
            dueDate: '2025-11-01T00:00:00.000Z',
            expectedAmount: 8400,
            paidAmount: 8400,
            status: 'PAID',
            paidAt: '2025-11-01T08:00:00.000Z',
          },
          {
            termNo: 2,
            startDate: '2026-02-01T00:00:00.000Z',
            endDate: '2026-04-30T00:00:00.000Z',
            dueDate: '2026-02-01T00:00:00.000Z',
            expectedAmount: 8400,
            paidAmount: 0,
            status: 'OVERDUE',
          },
        ],
      },
      {
        floorId: south5.id,
        roomNo: 'A502',
        status: 'DUE_SOON',
        tenantName: '韩先生',
        phone: '13755556666',
        idCardNo: '110101199909099999',
        rentAmount: 2300,
        depositAmount: 4600,
        paymentCycleMonths: 3,
        leaseStartDate: '2026-01-10T00:00:00.000Z',
        leaseEndDate: '2027-01-09T00:00:00.000Z',
        lastWaterReading: 68,
        lastElectricReading: 221,
        occupancies: [
          {
            kind: 'LEASE',
            status: 'ACTIVE',
            tenantName: '韩先生',
            phone: '13755556666',
            idCardNo: '110101199909099999',
            rentAmount: 2300,
            depositAmount: 4600,
            paymentCycleMonths: 3,
            startDate: '2026-01-10T00:00:00.000Z',
            endDate: '2027-01-09T00:00:00.000Z',
            remark: '临期待收场景',
          },
        ],
        paymentTerms: [
          {
            termNo: 1,
            startDate: '2026-01-10T00:00:00.000Z',
            endDate: '2026-04-09T00:00:00.000Z',
            dueDate: '2026-01-10T00:00:00.000Z',
            expectedAmount: 6900,
            paidAmount: 6900,
            status: 'PAID',
            paidAt: '2026-01-10T09:12:00.000Z',
          },
          {
            termNo: 2,
            startDate: '2026-04-10T00:00:00.000Z',
            endDate: '2026-07-09T00:00:00.000Z',
            dueDate: '2026-04-10T00:00:00.000Z',
            expectedAmount: 6900,
            paidAmount: 0,
            status: 'DUE_SOON',
          },
        ],
        bills: [
          {
            type: 'WATER',
            title: '2026-03 水费',
            amount: 36.4,
            status: 'PAID',
            dueDate: '2026-03-28T00:00:00.000Z',
            paidAt: '2026-03-28T19:00:00.000Z',
          },
          {
            type: 'ELECTRIC',
            title: '2026-03 电费',
            amount: 96.0,
            status: 'PAID',
            dueDate: '2026-03-28T00:00:00.000Z',
            paidAt: '2026-03-28T19:00:00.000Z',
          },
        ],
      },
      {
        floorId: youth6.id,
        roomNo: '603',
        status: 'DUE_SOON',
        tenantName: '小王',
        phone: '15099990000',
        idCardNo: '440101199801018888',
        rentAmount: 1750,
        depositAmount: 3500,
        paymentCycleMonths: 3,
        leaseStartDate: '2026-01-08T00:00:00.000Z',
        leaseEndDate: '2027-01-07T00:00:00.000Z',
        occupancies: [
          {
            kind: 'LEASE',
            status: 'ACTIVE',
            tenantName: '小王',
            phone: '15099990000',
            idCardNo: '440101199801018888',
            rentAmount: 1750,
            depositAmount: 3500,
            paymentCycleMonths: 3,
            startDate: '2026-01-08T00:00:00.000Z',
            endDate: '2027-01-07T00:00:00.000Z',
            remark: '合同待补传',
          },
        ],
        paymentTerms: [
          {
            termNo: 1,
            startDate: '2026-01-08T00:00:00.000Z',
            endDate: '2026-04-07T00:00:00.000Z',
            dueDate: '2026-01-08T00:00:00.000Z',
            expectedAmount: 5250,
            paidAmount: 5250,
            status: 'PAID',
            paidAt: '2026-01-08T10:00:00.000Z',
          },
          {
            termNo: 2,
            startDate: '2026-04-08T00:00:00.000Z',
            endDate: '2026-07-07T00:00:00.000Z',
            dueDate: '2026-04-08T00:00:00.000Z',
            expectedAmount: 5250,
            paidAmount: 0,
            status: 'DUE_SOON',
          },
        ],
      },
    ]

    for (const room of roomDefs) {
      created[room.roomNo] = await createRoomWithDetails(tx, room.floorId, room)
    }

    await tx.collection.createMany({
      data: [
        {
          roomId: created.N301.id,
          billType: 'RENT',
          title: '租金收款',
          amount: 21000,
          paidAt: at('2025-10-01T10:00:00.000Z'),
          coverageLabel: '覆盖第 1 期',
          relatedTermId: created.N301.paymentTerms[0].id,
        },
        {
          roomId: created.N303.id,
          billType: 'RENT',
          title: '租金收款',
          amount: 20400,
          paidAt: at('2025-10-01T09:36:00.000Z'),
          coverageLabel: '覆盖第 1 期',
          relatedTermId: created.N303.paymentTerms[0].id,
        },
        {
          roomId: created.A502.id,
          billType: 'RENT',
          title: '租金收款',
          amount: 6900,
          paidAt: at('2026-01-10T09:12:00.000Z'),
          coverageLabel: '覆盖第 1 期',
          relatedTermId: created.A502.paymentTerms[0].id,
        },
        {
          roomId: created['603'].id,
          billType: 'RENT',
          title: '租金收款',
          amount: 5250,
          paidAt: at('2026-01-08T10:00:00.000Z'),
          coverageLabel: '覆盖第 1 期',
          relatedTermId: created['603'].paymentTerms[0].id,
        },
      ],
    })

    await tx.operationLog.createMany({
      data: [
        {
          tenantId,
          userId,
          roomId: created.N301.id,
          action: 'seed.room',
          detail: '初始化房间 N301 联调数据',
        },
        {
          tenantId,
          userId,
          roomId: created.N302.id,
          action: 'seed.room',
          detail: '初始化房间 N302 空置联调数据',
        },
        {
          tenantId,
          userId,
          roomId: created.N303.id,
          action: 'seed.room',
          detail: '初始化房间 N303 在租联调数据',
        },
      ],
    })

    return {
      propertyCount: 2,
      roomCount: roomDefs.length,
    }
  })
}
