import { ref, watch } from 'vue'
import { toRoomAggregatePayload } from '../domain/rent-api-mappers.js'
import { activeUserId, buildTenantStorageKey } from './authStore.js'
import {
  cloneDeep,
  normalizeAttachmentFile,
  normalizeOccupancy,
  normalizePaymentTerm,
  normalizePropertyTree,
  generateId,
} from '../domain/rent-models'
import { buildAttachmentFile } from '../domain/rent-room-service.js'

const PROPERTIES_STORAGE_KEY = 'rent_demo_properties_v1'
const GLOBAL_CONFIG_STORAGE_KEY = 'rent_global_config_v1'

function findRoomById(tree, roomId) {
  for (const property of tree) {
    for (const block of property.blocks || []) {
      for (const floor of block.floors || []) {
        const room = (floor.rooms || []).find((item) => item.id === roomId)
        if (room) return room
      }
    }
  }
  return null
}

function hydrateScenarioData(tree) {
  const room = (id) => findRoomById(tree, id)

  const r3 = room('r3')
  if (r3) {
    r3.phone = '13911112222'
    r3.idCard = '310101199305155678'
    r3.deposit = 6800
    r3.hasIdCardPic = true
    r3.hasContract = true
    r3.attachmentFiles = {
      idCard: normalizeAttachmentFile({ name: '陈先生_身份证.jpg', uploadedAt: '2026-01-01 09:15', previewText: '身份证正反面影像' }),
      contract: normalizeAttachmentFile({ name: 'N303_租赁合同.pdf', uploadedAt: '2026-01-01 09:20', previewText: '已签署电子租赁合同' }),
    }
    r3.leaseStart = '2026-01-01'
    r3.leaseEnd = '2026-12-31'
    r3.lastWater = 138.4
    r3.lastElectric = 622
    r3.waterPrice = 5.5
    r3.electricPrice = 1.2
    r3.paymentSchedule = [
      normalizePaymentTerm({ id: 'term_r3_1', term: 1, startDate: '2026-01-01', endDate: '2026-06-30', dueDate: '2026-01-01', expectedAmount: 20400, paidAmount: 20400, payDate: '2026-01-01 09:36', receiptPic: true, status: 'paid' }),
      normalizePaymentTerm({ id: 'term_r3_2', term: 2, startDate: '2026-07-01', endDate: '2026-12-31', dueDate: '2026-07-01', expectedAmount: 20400, paidAmount: 0, status: 'unpaid' }),
    ]
    r3.bills = [
      { id: 'bill_r3_u1', title: '2026-03 水电杂费', type: 'utilities', amount: 186.5, status: 'paid', dueDate: '2026-03-31', payDate: '2026-04-01 20:16', receiptPic: true },
      { id: 'bill_r3_c1', title: '门禁卡补办', type: 'custom', amount: 50, status: 'paid', dueDate: '2026-03-12', payDate: '2026-03-12 17:28', receiptPic: false },
    ]
    r3.meterReadings = [
      { id: 'mr_r3_1', date: '2026-03-31', waterRead: 138.4, electricRead: 622, total: 186.5, billId: 'bill_r3_u1' },
    ]
    r3.occupancies = [
      normalizeOccupancy({ id: 'oc_r3_now', kind: 'lease', status: 'active', tenant: '陈先生', phone: '13911112222', idCard: '310101199305155678', startDate: '2026-01-01', endDate: '2026-12-31', rent: 3400, deposit: 6800, paymentCycle: 6, remark: '当前在租，资料完整', archive: { paymentSchedule: r3.paymentSchedule, collections: r3.collections, bills: r3.bills } }),
      normalizeOccupancy({ id: 'oc_r3_09', kind: 'lease', status: 'completed', tenant: '周小姐', phone: '13600009999', startDate: '2025-02-01', endDate: '2025-12-20', rent: 3200, deposit: 6400, paymentCycle: 3, remark: '按季付，正常退租', archive: { paymentSchedule: [{ expectedAmount: 38400 }], collections: [{ kind: 'utilities', amount: 420 }, { kind: 'custom', amount: 180 }], bills: [{ amount: 420 }, { amount: 180 }] } }),
      normalizeOccupancy({ id: 'oc_r3_08', kind: 'lease', status: 'completed', tenant: '林先生', phone: '13600008888', startDate: '2024-03-01', endDate: '2025-01-20', rent: 3100, deposit: 6200, paymentCycle: 3, remark: '租满一年后退租', archive: { paymentSchedule: [{ expectedAmount: 34100 }], collections: [{ kind: 'utilities', amount: 560 }], bills: [{ amount: 560 }] } }),
      normalizeOccupancy({ id: 'oc_r3_07', kind: 'lease', status: 'completed', tenant: '高女士', phone: '13577776666', startDate: '2023-04-15', endDate: '2024-02-18', rent: 3000, deposit: 6000, paymentCycle: 6, remark: '整租到期离场', archive: { paymentSchedule: [{ expectedAmount: 30000 }], collections: [{ kind: 'utilities', amount: 380 }, { kind: 'custom', amount: 90 }], bills: [{ amount: 380 }, { amount: 90 }] } }),
      normalizeOccupancy({ id: 'oc_r3_06', kind: 'lease', status: 'completed', tenant: '何先生', phone: '13555554444', startDate: '2022-06-01', endDate: '2023-03-31', rent: 2950, deposit: 5900, paymentCycle: 3, remark: '合同到期退租', archive: { paymentSchedule: [{ expectedAmount: 29500 }], collections: [{ kind: 'utilities', amount: 410 }], bills: [{ amount: 410 }] } }),
      normalizeOccupancy({ id: 'oc_r3_05', kind: 'lease', status: 'completed', tenant: '冯先生', phone: '13533332222', startDate: '2021-07-01', endDate: '2022-05-20', rent: 2850, deposit: 5700, paymentCycle: 3, remark: '提前一个月退租', archive: { paymentSchedule: [{ expectedAmount: 31350 }], collections: [{ kind: 'utilities', amount: 360 }, { kind: 'custom', amount: 120 }], bills: [{ amount: 360 }, { amount: 120 }] } }),
      normalizeOccupancy({ id: 'oc_r3_04', kind: 'lease', status: 'completed', tenant: '沈女士', phone: '13499998888', startDate: '2020-08-10', endDate: '2021-06-25', rent: 2780, deposit: 5560, paymentCycle: 1, remark: '月付稳定，正常退租', archive: { paymentSchedule: [{ expectedAmount: 30580 }], collections: [{ kind: 'utilities', amount: 500 }], bills: [{ amount: 500 }] } }),
      normalizeOccupancy({ id: 'oc_r3_03', kind: 'lease', status: 'completed', tenant: '唐先生', phone: '13477776666', startDate: '2019-09-01', endDate: '2020-07-31', rent: 2680, deposit: 5360, paymentCycle: 3, remark: '上一任租客已结清', archive: { paymentSchedule: [{ expectedAmount: 29480 }], collections: [{ kind: 'utilities', amount: 450 }, { kind: 'custom', amount: 60 }], bills: [{ amount: 450 }, { amount: 60 }] } }),
      normalizeOccupancy({ id: 'oc_r3_02', kind: 'lease', status: 'completed', tenant: '郭女士', phone: '13455554444', startDate: '2018-10-01', endDate: '2019-08-20', rent: 2550, deposit: 5100, paymentCycle: 6, remark: '半年付，按时退租', archive: { paymentSchedule: [{ expectedAmount: 28050 }], collections: [{ kind: 'utilities', amount: 320 }], bills: [{ amount: 320 }] } }),
      normalizeOccupancy({ id: 'oc_r3_01', kind: 'lease', status: 'completed', tenant: '钱先生', phone: '13433332222', startDate: '2017-11-01', endDate: '2018-09-10', rent: 2400, deposit: 4800, paymentCycle: 3, remark: '首任租客，已归档', archive: { paymentSchedule: [{ expectedAmount: 26400 }], collections: [{ kind: 'utilities', amount: 260 }, { kind: 'custom', amount: 40 }], bills: [{ amount: 260 }, { amount: 40 }] } }),
    ]
    r3.activeOccupancyId = 'oc_r3_now'
    r3.history = [
      { id: 'h_r3_1', type: 'checkin', date: '2026-01-01 09:40', remark: '办理入住并确认首期收款' },
      { id: 'h_r3_2', type: 'meter', date: '2026-03-31 18:12', remark: '录入抄表并生成 3 月水电杂费' },
      { id: 'h_r3_3', type: 'writeoff', date: '2026-04-01 20:16', remark: '记收 2026-03 水电杂费 186.5 元' },
    ]
  }

  const r4 = room('r4')
  if (r4) {
    r4.phone = '13688887777'
    r4.idCard = '430101199211123456'
    r4.deposit = 7200
    r4.hasIdCardPic = true
    r4.hasContract = true
    r4.attachmentFiles = {
      idCard: normalizeAttachmentFile({ name: '赵女士_身份证.jpg', uploadedAt: '2025-12-15 10:38', previewText: '身份证归档影像' }),
      contract: normalizeAttachmentFile({ name: 'N304_租约扫描件.pdf', uploadedAt: '2025-12-15 10:41', previewText: '合同扫描件' }),
    }
    r4.leaseStart = '2025-12-15'
    r4.leaseEnd = '2026-12-14'
    r4.lastWater = 206
    r4.lastElectric = 768
    r4.waterPrice = 5.5
    r4.electricPrice = 1.2
    r4.paymentSchedule = [
      normalizePaymentTerm({ id: 'term_r4_1', term: 1, startDate: '2025-12-15', endDate: '2026-03-14', dueDate: '2025-12-15', expectedAmount: 10800, paidAmount: 10800, payDate: '2025-12-15 11:02', receiptPic: true, status: 'paid' }),
      normalizePaymentTerm({ id: 'term_r4_2', term: 2, startDate: '2026-03-15', endDate: '2026-06-14', dueDate: '2026-03-15', expectedAmount: 10800, paidAmount: 0, status: 'overdue' }),
      normalizePaymentTerm({ id: 'term_r4_3', term: 3, startDate: '2026-06-15', endDate: '2026-09-14', dueDate: '2026-06-15', expectedAmount: 10800, paidAmount: 0, status: 'unpaid' }),
    ]
    r4.bills = [
      { id: 'bill_r4_u1', title: '2026-03 水电杂费', type: 'utilities', amount: 248.8, status: 'unpaid', dueDate: '2026-03-31', payDate: '', receiptPic: false },
      { id: 'bill_r4_c1', title: '保洁补收费', type: 'custom', amount: 120, status: 'unpaid', dueDate: '2026-04-02', payDate: '', receiptPic: false },
    ]
    r4.meterReadings = [
      { id: 'mr_r4_1', date: '2026-03-31', waterRead: 206, electricRead: 768, total: 248.8, billId: 'bill_r4_u1' },
    ]
    r4.occupancies = [
      normalizeOccupancy({ id: 'oc_r4_now', kind: 'lease', status: 'active', tenant: '赵女士', phone: '13688887777', idCard: '430101199211123456', startDate: '2025-12-15', endDate: '2026-12-14', rent: 3600, deposit: 7200, paymentCycle: 3, remark: '连续欠费场景' }),
    ]
    r4.activeOccupancyId = 'oc_r4_now'
    r4.history = [
      { id: 'h_r4_1', type: 'rent_writeoff', date: '2025-12-15 11:02', remark: '记收房租第 1 期 10800 元' },
      { id: 'h_r4_2', type: 'meter', date: '2026-03-31 21:08', remark: '录入抄表并生成未结清水电杂费' },
      { id: 'h_r4_3', type: 'custom_charge', date: '2026-04-02 10:20', remark: '新增灵活收费：保洁补收费 120 元' },
    ]
  }

  const r6 = room('r6')
  if (r6) {
    r6.phone = '13566665555'
    r6.idCard = '320101198811224433'
    r6.deposit = 5600
    r6.hasIdCardPic = false
    r6.hasContract = true
    r6.attachmentFiles = {
      idCard: null,
      contract: normalizeAttachmentFile({ name: 'N201_合同扫描件.pdf', uploadedAt: '2025-11-01 08:03', previewText: '合同已归档，身份证待补传' }),
    }
    r6.leaseStart = '2025-11-01'
    r6.leaseEnd = '2026-10-31'
    r6.lastWater = 98
    r6.lastElectric = 350
    r6.waterPrice = 5.5
    r6.electricPrice = 1.2
    r6.paymentSchedule = [
      normalizePaymentTerm({ id: 'term_r6_1', term: 1, startDate: '2025-11-01', endDate: '2026-01-31', dueDate: '2025-11-01', expectedAmount: 8400, paidAmount: 8400, payDate: '2025-11-01 08:00', receiptPic: false, status: 'paid' }),
      normalizePaymentTerm({ id: 'term_r6_2', term: 2, startDate: '2026-02-01', endDate: '2026-04-30', dueDate: '2026-02-01', expectedAmount: 8400, paidAmount: 0, status: 'overdue' }),
    ]
    r6.occupancies = [
      normalizeOccupancy({ id: 'oc_r6_now', kind: 'lease', status: 'active', tenant: '李女士', phone: '13566665555', startDate: '2025-11-01', endDate: '2026-10-31', rent: 2800, deposit: 5600, paymentCycle: 3, remark: '缺身份证资料场景' }),
    ]
    r6.activeOccupancyId = 'oc_r6_now'
    r6.history = [
      { id: 'h_r6_1', type: 'checkin', date: '2025-11-01 08:00', remark: '办理入住，合同已归档，身份证缺失' },
    ]
  }

  const r11 = room('r11')
  if (r11) {
    r11.phone = '13755556666'
    r11.idCard = '110101199909099999'
    r11.deposit = 4600
    r11.hasIdCardPic = true
    r11.hasContract = true
    r11.attachmentFiles = {
      idCard: normalizeAttachmentFile({ name: '韩先生_身份证.jpg', uploadedAt: '2026-01-10 09:01', previewText: '身份证影像' }),
      contract: normalizeAttachmentFile({ name: 'A502_电子合同.pdf', uploadedAt: '2026-01-10 09:06', previewText: '电子合同存档' }),
    }
    r11.leaseStart = '2026-01-10'
    r11.leaseEnd = '2027-01-09'
    r11.lastWater = 68
    r11.lastElectric = 221
    r11.paymentSchedule = [
      normalizePaymentTerm({ id: 'term_r11_1', term: 1, startDate: '2026-01-10', endDate: '2026-04-09', dueDate: '2026-01-10', expectedAmount: 6900, paidAmount: 6900, payDate: '2026-01-10 09:12', receiptPic: true, status: 'paid' }),
      normalizePaymentTerm({ id: 'term_r11_2', term: 2, startDate: '2026-04-10', endDate: '2026-07-09', dueDate: '2026-04-10', expectedAmount: 6900, paidAmount: 0, status: 'due_soon' }),
    ]
    r11.bills = [
      { id: 'bill_r11_u1', title: '2026-03 水电杂费', type: 'utilities', amount: 132.4, status: 'paid', dueDate: '2026-03-28', payDate: '2026-03-28 19:00', receiptPic: true },
    ]
    r11.meterReadings = [
      { id: 'mr_r11_1', date: '2026-03-28', waterRead: 68, electricRead: 221, total: 132.4, billId: 'bill_r11_u1' },
    ]
    r11.occupancies = [
      normalizeOccupancy({ id: 'oc_r11_now', kind: 'lease', status: 'active', tenant: '韩先生', phone: '13755556666', idCard: '110101199909099999', startDate: '2026-01-10', endDate: '2027-01-09', rent: 2300, deposit: 4600, paymentCycle: 3, remark: '临期待收场景' }),
    ]
    r11.activeOccupancyId = 'oc_r11_now'
    r11.history = [
      { id: 'h_r11_1', type: 'writeoff', date: '2026-03-28 19:00', remark: '记收 2026-03 水电杂费 132.4 元' },
    ]
  }

  const r13 = room('r13')
  if (r13) {
    r13.lastWater = 32
    r13.lastElectric = 105
    r13.waterPrice = 5.5
    r13.electricPrice = 1.2
    r13.occupancies = [
      normalizeOccupancy({ id: 'oc_r13_prev', kind: 'lease', status: 'completed', tenant: '周同学', phone: '18800001111', startDate: '2025-09-01', endDate: '2026-02-20', rent: 2100, deposit: 4200, paymentCycle: 3, remark: '上一任正常退租' }),
      normalizeOccupancy({ id: 'oc_r13_idle', kind: 'idle', status: 'idle', startDate: '2026-02-21', endDate: '', remark: '当前空置待招租' }),
    ]
    r13.history = [
      { id: 'h_r13_1', type: 'checkout', date: '2026-02-20 18:30', remark: '上一任租客已退租归档，房间重置为空置' },
    ]
  }

  const r16 = room('r16')
  if (r16) {
    r16.history = [
      { id: 'h_r16_1', type: 'checkout', date: '2026-02-28 12:10', remark: '上一任租客退租，已清空账单和抄表记录' },
      { id: 'h_r16_2', type: 'idle', date: '2026-03-01 09:00', remark: '进入空置期，等待办理入住' },
    ]
  }

  const r19 = room('r19')
  if (r19) {
    r19.phone = '15099990000'
    r19.idCard = '440101199801018888'
    r19.deposit = 3500
    r19.hasIdCardPic = true
    r19.hasContract = false
    r19.attachmentFiles = {
      idCard: normalizeAttachmentFile({ name: '603_王先生身份证.jpg', uploadedAt: '2026-01-08 09:58', previewText: '身份证已上传，合同待补传' }),
      contract: null,
    }
    r19.leaseStart = '2026-01-08'
    r19.leaseEnd = '2027-01-07'
    r19.lastWater = 45
    r19.lastElectric = 180
    r19.paymentSchedule = [
      normalizePaymentTerm({ id: 'term_r19_1', term: 1, startDate: '2026-01-08', endDate: '2026-04-07', dueDate: '2026-01-08', expectedAmount: 5250, paidAmount: 5250, payDate: '2026-01-08 10:00', receiptPic: true, status: 'paid' }),
      normalizePaymentTerm({ id: 'term_r19_2', term: 2, startDate: '2026-04-08', endDate: '2026-07-07', dueDate: '2026-04-08', expectedAmount: 5250, paidAmount: 0, status: 'due_soon' }),
    ]
    r19.occupancies = [
      normalizeOccupancy({ id: 'oc_r19_now', kind: 'lease', status: 'active', tenant: '小王', phone: '15099990000', idCard: '440101199801018888', startDate: '2026-01-08', endDate: '2027-01-07', rent: 1750, deposit: 3500, paymentCycle: 3, remark: '合同待补传场景' }),
    ]
    r19.activeOccupancyId = 'oc_r19_now'
    r19.history = [
      { id: 'h_r19_1', type: 'checkin', date: '2026-01-08 10:00', remark: '已办理入住，合同扫描件待补传' },
    ]
  }

  return tree
}

function sanitizeDemoLabels(tree) {
  const renameProperty = (propertyId, name) => {
    const property = tree.find((item) => item.id === propertyId)
    if (property) property.name = name
  }
  const renameBlock = (propertyId, blockId, name) => {
    const property = tree.find((item) => item.id === propertyId)
    const block = (property?.blocks || []).find((item) => item.id === blockId)
    if (block) block.name = name
  }
  const renameRoom = (roomId, fields) => {
    const room = findRoomById(tree, roomId)
    if (!room) return
    Object.assign(room, fields)
  }

  renameProperty('p1', '江南别院（高端）')
  renameProperty('p2', '城西青年公寓')
  renameBlock('p1', 'b1', '北房主楼')
  renameBlock('p1', 'b2', '南区公寓 A 栋')
  renameBlock('p2', 'b3', '1 号楼')

  renameRoom('r1', { tenant: '张总' })
  renameRoom('r3', { tenant: '陈先生' })
  renameRoom('r4', { tenant: '赵女士' })
  renameRoom('r6', { tenant: '李女士' })
  renameRoom('r7', { tenant: '王教授' })
  renameRoom('r8', { tenant: '许先生' })
  renameRoom('r10', { tenant: '周老师' })
  renameRoom('r11', { tenant: '韩先生' })
  renameRoom('r12', { tenant: '苏女士' })
  renameRoom('r14', { tenant: '刘阿姨' })
  renameRoom('r15', { tenant: '蒋先生' })
  renameRoom('r17', { tenant: '小林' })
  renameRoom('r18', { tenant: '阿哲' })
  renameRoom('r19', { tenant: '小王' })

  return tree
}

function sanitizeScenarioRooms(tree) {
  const patchRoom = (roomId, patcher) => {
    const room = findRoomById(tree, roomId)
    if (!room) return
    patcher(room)
  }

  patchRoom('r3', (room) => {
    room.attachmentFiles = {
      idCard: normalizeAttachmentFile(buildAttachmentFile('idCard', { tenant: '陈先生', roomNo: room.roomNo, now: '2026-01-01 09:15' })),
      contract: normalizeAttachmentFile(buildAttachmentFile('contract', { tenant: '陈先生', roomNo: room.roomNo, now: '2026-01-01 09:20' })),
    }
    room.bills = (room.bills || []).map((bill) => ({
      ...bill,
      title: bill.type === 'utilities' ? '2026-03 水电杂费' : bill.title,
    }))
    room.occupancies = [
      normalizeOccupancy({
        id: 'oc_r3_now',
        kind: 'lease',
        status: 'active',
        tenant: '陈先生',
        phone: '13911112222',
        idCard: '320101198710103456',
        startDate: '2025-10-01',
        endDate: '2026-09-30',
        rent: 3400,
        deposit: 6800,
        paymentCycle: 6,
        remark: '按约半年付，合同资料齐全',
      }),
      normalizeOccupancy({
        id: 'oc_r3_prev_1',
        kind: 'lease',
        status: 'archived',
        tenant: '周小姐',
        phone: '13800008888',
        startDate: '2024-09-01',
        endDate: '2025-08-31',
        rent: 3200,
        deposit: 6400,
        paymentCycle: 3,
        remark: '按季付，退租交接完成',
        archivedBillsCount: 3,
        archivedReadingsCount: 2,
        totalRentCollected: 38400,
        totalUtilityCollected: 1260,
      }),
    ]
    room.activeOccupancyId = 'oc_r3_now'
    room.history = [
      { id: 'h_r3_1', type: 'checkin', date: '2025-10-01 09:30', remark: '陈先生办理入住，已上传身份证和合同' },
      { id: 'h_r3_2', type: 'rent', date: '2026-03-31 20:16', remark: '确认收取 2026-03 水电杂费 186.50 元' },
    ]
  })

  patchRoom('r4', (room) => {
    room.attachmentFiles = {
      idCard: normalizeAttachmentFile(buildAttachmentFile('idCard', { tenant: '赵女士', roomNo: room.roomNo, now: '2025-12-15 10:38' })),
      contract: normalizeAttachmentFile(buildAttachmentFile('contract', { tenant: '赵女士', roomNo: room.roomNo, now: '2025-12-15 10:41' })),
    }
    room.occupancies = [
      normalizeOccupancy({
        id: 'oc_r4_now',
        kind: 'lease',
        status: 'active',
        tenant: '赵女士',
        phone: '13720001111',
        idCard: '330102199203155678',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        rent: 3000,
        deposit: 6000,
        paymentCycle: 1,
        remark: '本月房租尚未收齐，需要继续跟进',
      }),
    ]
    room.activeOccupancyId = 'oc_r4_now'
    room.history = [
      { id: 'h_r4_1', type: 'checkin', date: '2026-01-01 10:00', remark: '赵女士办理入住，身份证已上传，合同待补' },
      { id: 'h_r4_2', type: 'custom', date: '2026-03-12 17:28', remark: '新增门禁卡补办收费 50 元' },
    ]
  })

  patchRoom('r6', (room) => {
    room.attachmentFiles = {
      idCard: normalizeAttachmentFile(buildAttachmentFile('idCard', { tenant: '李女士', roomNo: room.roomNo, now: '2025-12-01 11:01' })),
      contract: normalizeAttachmentFile(buildAttachmentFile('contract', { tenant: '李女士', roomNo: room.roomNo, now: '2025-12-01 11:02' })),
    }
    room.occupancies = [
      normalizeOccupancy({
        id: 'oc_r6_now',
        kind: 'lease',
        status: 'active',
        tenant: '李女士',
        phone: '13600001111',
        idCard: '440103199412123456',
        startDate: '2025-12-01',
        endDate: '2026-11-30',
        rent: 3000,
        deposit: 6000,
        paymentCycle: 1,
        remark: '资料待补齐，当前房租存在欠费',
      }),
      normalizeOccupancy({
        id: 'oc_r6_prev_1',
        kind: 'vacancy',
        status: 'archived',
        startDate: '2025-11-01',
        endDate: '2025-11-30',
        remark: '短暂空置，待重新出租',
      }),
    ]
    room.activeOccupancyId = 'oc_r6_now'
    room.history = [
      { id: 'h_r6_1', type: 'checkin', date: '2025-12-01 11:00', remark: '李女士办理入住，资料待补' },
      { id: 'h_r6_2', type: 'rent', date: '2026-03-25 18:00', remark: '本期房租仍未收齐，系统标记为欠费' },
    ]
  })

  patchRoom('r11', (room) => {
    room.attachmentFiles = {
      idCard: normalizeAttachmentFile(buildAttachmentFile('idCard', { tenant: '韩先生', roomNo: room.roomNo, now: '2026-01-10 09:01' })),
      contract: normalizeAttachmentFile(buildAttachmentFile('contract', { tenant: '韩先生', roomNo: room.roomNo, now: '2026-01-10 09:06' })),
    }
    room.occupancies = [
      normalizeOccupancy({
        id: 'oc_r11_now',
        kind: 'lease',
        status: 'active',
        tenant: '韩先生',
        phone: '13655553333',
        idCard: '440101199003031234',
        startDate: '2026-02-01',
        endDate: '2027-01-31',
        rent: 1800,
        deposit: 3600,
        paymentCycle: 3,
        remark: '近期已补传身份证和合同资料',
      }),
    ]
    room.activeOccupancyId = 'oc_r11_now'
    room.history = [
      { id: 'h_r11_1', type: 'attachment', date: '2026-03-30 09:10', remark: '补传韩先生身份证与合同扫描件' },
    ]
  })

  patchRoom('r13', (room) => {
    room.occupancies = [
      normalizeOccupancy({
        id: 'oc_r13_prev_1',
        kind: 'lease',
        status: 'archived',
        tenant: '王师傅',
        phone: '13877776666',
        startDate: '2024-05-01',
        endDate: '2025-03-31',
        rent: 2400,
        deposit: 4800,
        paymentCycle: 6,
        remark: '租期结束后正常退租',
        archivedBillsCount: 5,
        archivedReadingsCount: 4,
        totalRentCollected: 26400,
        totalUtilityCollected: 1380,
      }),
      normalizeOccupancy({
        id: 'oc_r13_empty_1',
        kind: 'vacancy',
        status: 'archived',
        startDate: '2025-04-01',
        endDate: '2026-02-28',
        remark: '长期空置，待重新装修后再出租',
      }),
    ]
    room.activeOccupancyId = null
    room.history = [
      { id: 'h_r13_1', type: 'checkout', date: '2025-03-31 17:40', remark: '王师傅退租，完成水电结算与押金返还' },
    ]
  })

  patchRoom('r16', (room) => {
    room.occupancies = [
      normalizeOccupancy({
        id: 'oc_r16_prev_1',
        kind: 'lease',
        status: 'archived',
        tenant: '刘姐',
        phone: '13566668888',
        startDate: '2024-01-01',
        endDate: '2025-12-31',
        rent: 2600,
        deposit: 5200,
        paymentCycle: 12,
        remark: '两年整租后退租，资料已归档',
        archivedBillsCount: 8,
        archivedReadingsCount: 6,
        totalRentCollected: 62400,
        totalUtilityCollected: 2560,
      }),
      normalizeOccupancy({
        id: 'oc_r16_empty_1',
        kind: 'vacancy',
        status: 'archived',
        startDate: '2026-01-01',
        endDate: '2026-04-09',
        remark: '已退租，待保洁和重新上架',
      }),
    ]
    room.activeOccupancyId = null
    room.history = [
      { id: 'h_r16_1', type: 'checkout', date: '2025-12-31 15:00', remark: '刘姐退租，结算完成并进入空置状态' },
    ]
  })

  patchRoom('r19', (room) => {
    room.occupancies = [
      normalizeOccupancy({
        id: 'oc_r19_now',
        kind: 'lease',
        status: 'active',
        tenant: '小王',
        phone: '15099990000',
        idCard: '440101199801018888',
        startDate: '2026-01-08',
        endDate: '2027-01-07',
        rent: 1750,
        deposit: 3500,
        paymentCycle: 3,
        remark: '合同待补传扫描件',
      }),
    ]
    room.activeOccupancyId = 'oc_r19_now'
    room.history = [
      { id: 'h_r19_1', type: 'checkin', date: '2026-01-08 10:00', remark: '小王办理入住，合同扫描件待补传' },
    ]
  })

  return tree
}

const seedProperties = sanitizeScenarioRooms(sanitizeDemoLabels(hydrateScenarioData(normalizePropertyTree([
  {
    id: 'p1',
    name: '江南别院（高端）',
    blocks: [
      {
        id: 'b1',
        name: '北房主楼',
        floors: [
          {
            floor: 3,
            rooms: [
              {
                id: 'r1',
                roomNo: 'N301',
                status: 'due_soon',
                tenant: '张总',
                phone: '13800138000',
                rent: 3500,
                deposit: 7000,
                paymentCycle: 6,
                nextDueDate: '2026-04-01',
                nextDueAmount: 21000,
                hasIdCardPic: true,
                hasContract: true,
                leaseStart: '2025-10-01',
                leaseEnd: '2026-09-30',
                lastWater: 220.5,
                lastElectric: 845.0,
                occupancies: [
                  {
                    id: 'oc_n301',
                    kind: 'lease',
                    status: 'active',
                    tenant: '张总',
                    phone: '13800138000',
                    startDate: '2025-10-01',
                    endDate: '2026-09-30',
                    rent: 3500,
                    deposit: 7000,
                    paymentCycle: 6,
                    remark: '签约入住（半年付）',
                  },
                ],
                activeOccupancyId: 'oc_n301',
                paymentSchedule: [
                  {
                    id: 'term_n301_1',
                    term: 1,
                    startDate: '2025-10-01',
                    endDate: '2026-03-31',
                    dueDate: '2025-10-01',
                    expectedAmount: 21000,
                    paidAmount: 21000,
                    payDate: '2025-10-01 10:00',
                    receiptPic: true,
                    status: 'paid',
                  },
                  {
                    id: 'term_n301_2',
                    term: 2,
                    startDate: '2026-04-01',
                    endDate: '2026-09-30',
                    dueDate: '2026-04-01',
                    expectedAmount: 21000,
                    paidAmount: 0,
                    status: 'due_soon',
                  },
                ],
              },
              {
                id: 'r2',
                roomNo: 'N302',
                status: 'empty',
                tenant: '',
                rent: 3200,
                paymentCycle: 3,
                lastWater: 150,
                lastElectric: 500,
                occupancies: [
                  {
                    id: 'oc_n302_prev',
                    kind: 'lease',
                    status: 'completed',
                    tenant: '林女士（前任）',
                    phone: '13700000000',
                    startDate: '2025-02-15',
                    endDate: '2026-02-14',
                    rent: 3000,
                    deposit: 6000,
                    paymentCycle: 3,
                    remark: '退租已结清',
                  },
                  {
                    id: 'oc_n302_idle',
                    kind: 'idle',
                    status: 'idle',
                    startDate: '2026-02-15',
                    endDate: '',
                    remark: '空置中',
                  },
                ],
              },
              { id: 'r3', roomNo: 'N303', status: 'rented', tenant: '陈先生', rent: 3400, paymentCycle: 6, hasIdCardPic: true, hasContract: true },
              { id: 'r4', roomNo: 'N304', status: 'overdue', tenant: '赵女士', rent: 3600, paymentCycle: 3, nextDueDate: '2026-03-15', nextDueAmount: 10800 },
              { id: 'r5', roomNo: 'N305', status: 'rented', tenant: '王阿姨', rent: 3000, paymentCycle: 3 },
            ],
          },
          {
            floor: 2,
            rooms: [
              { id: 'r6', roomNo: 'N201', status: 'overdue', tenant: '李女士', rent: 2800, paymentCycle: 3, nextDueDate: '2026-03-15', nextDueAmount: 8400 },
              { id: 'r7', roomNo: 'N202', status: 'rented', tenant: '王教授', rent: 3000, paymentCycle: 12, hasIdCardPic: true, hasContract: true },
              { id: 'r8', roomNo: 'N203', status: 'rented', tenant: '许先生', rent: 2900, paymentCycle: 6 },
              {
                id: 'r9',
                roomNo: 'N204',
                status: 'empty',
                tenant: '',
                rent: 2600,
                paymentCycle: 3,
                occupancies: [
                  {
                    id: 'oc_n204_idle',
                    kind: 'idle',
                    status: 'idle',
                    startDate: '2026-03-01',
                    endDate: '',
                    remark: '空置中，待招租',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'b2',
        name: '南区公寓 A 栋',
        floors: [
          {
            floor: 5,
            rooms: [
              { id: 'r10', roomNo: 'A501', status: 'rented', tenant: '周老师', rent: 2400, paymentCycle: 3 },
              { id: 'r11', roomNo: 'A502', status: 'due_soon', tenant: '韩先生', rent: 2300, paymentCycle: 3, nextDueDate: '2026-04-10', nextDueAmount: 6900 },
              { id: 'r12', roomNo: 'A503', status: 'rented', tenant: '苏女士', rent: 2200, paymentCycle: 3 },
              { id: 'r13', roomNo: 'A504', status: 'empty', tenant: '', rent: 2100, paymentCycle: 3 },
            ],
          },
          {
            floor: 4,
            rooms: [
              { id: 'r14', roomNo: 'A401', status: 'rented', tenant: '刘阿姨', rent: 2200, paymentCycle: 3 },
              { id: 'r15', roomNo: 'A402', status: 'rented', tenant: '蒋先生', rent: 2200, paymentCycle: 3 },
              {
                id: 'r16',
                roomNo: 'A403',
                status: 'empty',
                tenant: '',
                rent: 2000,
                paymentCycle: 3,
                occupancies: [
                  { id: 'oc_a403_prev', kind: 'lease', status: 'completed', tenant: '前任租客', startDate: '2025-09-01', endDate: '2026-02-28', rent: 2000, deposit: 4000, paymentCycle: 3, remark: '正常退租，已完成交接' },
                  { id: 'oc_a403_idle', kind: 'idle', status: 'idle', startDate: '2026-03-01', endDate: '', remark: '空置中' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'p2',
    name: '城西青年公寓',
    blocks: [
      {
        id: 'b3',
        name: '1 号楼',
        floors: [
          {
            floor: 6,
            rooms: [
              { id: 'r17', roomNo: '601', status: 'rented', tenant: '小林', rent: 1800, paymentCycle: 3 },
              { id: 'r18', roomNo: '602', status: 'rented', tenant: '阿哲', rent: 1800, paymentCycle: 3 },
              { id: 'r19', roomNo: '603', status: 'due_soon', tenant: '小王', rent: 1750, paymentCycle: 3, nextDueDate: '2026-04-08', nextDueAmount: 5250 },
              {
                id: 'r20',
                roomNo: '604',
                status: 'empty',
                tenant: '',
                rent: 1700,
                paymentCycle: 3,
                occupancies: [{ id: 'oc_604_idle', kind: 'idle', status: 'idle', startDate: '2026-01-20', endDate: '', remark: '空置中' }],
              },
            ],
          },
        ],
      },
    ],
  },
]))))

function loadStoredProperties() {
  try {
    const stored = uni.getStorageSync(buildTenantStorageKey(PROPERTIES_STORAGE_KEY))
    if (!stored) return cloneDeep(seedProperties)
    return normalizePropertyTree(stored)
  } catch {
    return cloneDeep(seedProperties)
  }
}

function saveStoredProperties(next) {
  try {
    uni.setStorageSync(buildTenantStorageKey(PROPERTIES_STORAGE_KEY), cloneDeep(next))
  } catch {
    // Ignore storage failures in demo mode.
  }
}

function loadStoredGlobalConfig() {
  const fallback = {
    waterPriceDefault: 5.5,
    electricPriceDefault: 1.2,
  }
  try {
    const stored = uni.getStorageSync(buildTenantStorageKey(GLOBAL_CONFIG_STORAGE_KEY))
    return stored ? { ...fallback, ...stored } : fallback
  } catch {
    return fallback
  }
}

export const properties = ref(loadStoredProperties())

export const globalConfig = ref(loadStoredGlobalConfig())

watch(activeUserId, () => {
  properties.value = loadStoredProperties()
  globalConfig.value = loadStoredGlobalConfig()
})

export function cloneProperties() {
  return JSON.parse(JSON.stringify(properties.value))
}

export function setProperties(next) {
  const normalized = normalizePropertyTree(next)
  properties.value = normalized
  saveStoredProperties(normalized)
}

export function resetDemoProperties() {
  properties.value = cloneDeep(seedProperties)
  saveStoredProperties(properties.value)
}

export function saveGlobalConfig(next) {
  const normalized = {
    waterPriceDefault: Number(next?.waterPriceDefault || 5.5),
    electricPriceDefault: Number(next?.electricPriceDefault || 1.2),
  }
  globalConfig.value = normalized
  try {
    uni.setStorageSync(buildTenantStorageKey(GLOBAL_CONFIG_STORAGE_KEY), normalized)
  } catch {}
}

export function findProperty(propertyId) {
  return properties.value.find((p) => p.id === propertyId) || null
}

export function findBlock(propertyId, blockId) {
  const property = findProperty(propertyId)
  if (!property) return null
  return property.blocks.find((b) => b.id === blockId) || null
}

export function findRoomWithFloor(propertyId, blockId, roomId) {
  const block = findBlock(propertyId, blockId)
  if (!block) return null
  for (const floorItem of block.floors) {
    const room = floorItem.rooms.find((r) => r.id === roomId)
    if (room) return { room, floor: floorItem.floor }
  }
  return null
}

export function getStatusLabel(status) {
  switch (status) {
    case 'overdue':
      return '欠费未收'
    case 'due_soon':
      return '待收款'
    case 'rented':
      return '已出租'
    case 'empty':
    default:
      return '空置中'
  }
}

export function buildRoomReminderText(room) {
  const tenant = room.tenant || '租客'
  const dueDate = room.nextDueDate ? `截止 ${room.nextDueDate}` : '请尽快处理'
  const amount = room.nextDueAmount || (room.rent ? room.rent * (room.paymentCycle || 1) : 0)
  const type = room.status === 'overdue' ? '已逾期' : '本期'
  return `${tenant}您好，${room.roomNo} ${type}房租应缴 ￥${amount}，${dueDate}。收到请回复，谢谢。`
}

function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseISODate(iso) {
  const s = String(iso || '').trim()
  if (!s) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d
}

export function generatePaymentSchedule({ startDate, endDate, cycleMonths, rentPerCycle }) {
  const start = parseISODate(startDate)
  let end = parseISODate(endDate)
  if (!start) return []
  if (!end) {
    end = new Date(start)
    end.setFullYear(end.getFullYear() + 1)
    end.setDate(end.getDate() - 1)
  }

  const months = Number(cycleMonths || 0)
  const rent = Number(rentPerCycle || 0)
  if (!Number.isFinite(months) || months <= 0 || !Number.isFinite(rent) || rent <= 0) return []

  const today = new Date()
  const todayISO = toISODate(today)

  const schedule = []
  let cursor = new Date(start)
  let term = 1
  let guard = 0
  while (cursor <= end && guard < 60) {
    guard++
    const termStart = new Date(cursor)
    const termEnd = new Date(cursor)
    termEnd.setMonth(termEnd.getMonth() + months)
    termEnd.setDate(termEnd.getDate() - 1)
    if (termEnd > end) termEnd.setTime(end.getTime())

    const dueDate = toISODate(termStart)
    const expectedAmount = Number((rent * months).toFixed(2))

    let status = 'unpaid'
    if (dueDate < todayISO) status = 'overdue'
    else {
      const diffDays = Math.floor((new Date(dueDate).getTime() - new Date(todayISO).getTime()) / (24 * 60 * 60 * 1000))
      if (diffDays <= 7) status = 'due_soon'
    }

    schedule.push(
      normalizePaymentTerm({
        id: `term_${Date.now()}_${term}`,
        term,
        startDate: toISODate(termStart),
        endDate: toISODate(termEnd),
        dueDate,
        expectedAmount,
        paidAmount: 0,
        status,
      })
    )

    cursor = new Date(termEnd)
    cursor.setDate(cursor.getDate() + 1)
    term++
  }

  return schedule
}

export function buildRoomAggregateForApi(propertyId, blockId, roomId) {
  const property = findProperty(propertyId)
  const block = findBlock(propertyId, blockId)
  const roomWithFloor = findRoomWithFloor(propertyId, blockId, roomId)
  if (!property || !block || !roomWithFloor) return null

  return toRoomAggregatePayload({
    property,
    block,
    floor: roomWithFloor.floor,
    room: roomWithFloor.room,
  })
}

