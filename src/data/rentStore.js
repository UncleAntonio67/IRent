import { ref } from 'vue'

const PROPERTIES_STORAGE_KEY = 'rent_demo_properties_v1'
const GLOBAL_CONFIG_STORAGE_KEY = 'rent_global_config_v1'

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

function normalizeOccupancy(occ) {
  const rent = Number(occ.rent || 0) || 0
  const paymentCycle = Number(occ.paymentCycle || 3) || 3
  return {
    id: occ.id || generateId('oc'),
    kind: occ.kind || 'lease', // lease | idle
    status: occ.status || 'completed', // active | completed | idle
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

function normalizePaymentTerm(term) {
  return {
    id: term.id || generateId('term'),
    term: Number(term.term || 1) || 1,
    startDate: term.startDate || '',
    endDate: term.endDate || '',
    dueDate: term.dueDate || term.startDate || '',
    expectedAmount: Number(term.expectedAmount || 0) || 0,
    paidAmount: Number(term.paidAmount || 0) || 0,
    payDate: term.payDate || '',
    receiptPic: Boolean(term.receiptPic),
    status: term.status || 'unpaid', // unpaid | paid | due_soon | overdue
  }
}

function normalizeAttachmentFile(file, fallbackName) {
  if (!file) return null
  return {
    name: file.name || fallbackName || '未命名文件',
    uploadedAt: file.uploadedAt || '',
    source: file.source || 'mock',
    previewText: file.previewText || '',
  }
}

function normalizeRoom(room) {
  const rent = Number(room.rent || 0) || 0
  const paymentCycle = Number(room.paymentCycle || 3) || 3
  const normalized = {
    id: room.id || generateId('r'),
    roomNo: room.roomNo || '000',
    status: room.status || 'empty', // empty | rented | due_soon | overdue
    tenant: room.tenant || '',
    phone: room.phone || '',
    idCard: room.idCard || '',
    rent,
    deposit: Number(room.deposit || (rent ? rent : 0)) || 0,
    paymentCycle, // months per term (3/6/12 etc). For prototype only.
    nextDueDate: room.nextDueDate || '',
    nextDueAmount: Number(room.nextDueAmount || 0) || 0,
    hasIdCardPic: Boolean(room.hasIdCardPic),
    hasContract: Boolean(room.hasContract),
    attachmentFiles: {
      idCard: normalizeAttachmentFile(room.attachmentFiles?.idCard, '身份证照片.jpg'),
      contract: normalizeAttachmentFile(room.attachmentFiles?.contract, '租赁合同.pdf'),
    },
    leaseStart: room.leaseStart || '',
    leaseEnd: room.leaseEnd || '',
    lastWater: Number(room.lastWater || 0) || 0,
    lastElectric: Number(room.lastElectric || 0) || 0,
    waterPrice: Number(room.waterPrice || 5.5) || 5.5,
    electricPrice: Number(room.electricPrice || 1.2) || 1.2,
    bills: Array.isArray(room.bills) ? room.bills : [],
    meterReadings: Array.isArray(room.meterReadings) ? room.meterReadings : [],
    history: Array.isArray(room.history) ? room.history : [],
    occupancies: Array.isArray(room.occupancies) ? room.occupancies.map(normalizeOccupancy) : [],
    activeOccupancyId: room.activeOccupancyId || '',
    paymentSchedule: Array.isArray(room.paymentSchedule) ? room.paymentSchedule.map(normalizePaymentTerm) : [],
  }

  // Ensure every room has "历史入住情况" data so UI is consistent.
  if (normalized.occupancies.length === 0) {
    if (normalized.status === 'empty') {
      normalized.occupancies = [
        normalizeOccupancy({
          kind: 'idle',
          status: 'idle',
          startDate: '',
          endDate: '',
          remark: '当前空置',
        }),
      ]
    } else {
      normalized.occupancies = [
        normalizeOccupancy({
          kind: 'lease',
          status: 'active',
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

  // Fill activeOccupancyId if missing.
  if (!normalized.activeOccupancyId) {
    const active = normalized.occupancies.find((o) => o.status === 'active')
    normalized.activeOccupancyId = active?.id || ''
  }

  return normalized
}

function normalizePropertyTree(tree) {
  return (tree || []).map((property) => ({
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
      idCard: normalizeAttachmentFile({ name: '陈先生_身份证.jpg', uploadedAt: '2026-01-01 09:15', previewText: '身份证正反面影像（模拟）' }),
      contract: normalizeAttachmentFile({ name: 'N303_租赁合同.pdf', uploadedAt: '2026-01-01 09:20', previewText: '已签署电子租赁合同（模拟）' }),
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
      normalizeOccupancy({ id: 'oc_r3_prev', kind: 'lease', status: 'completed', tenant: 'Sun', phone: '13600009999', startDate: '2025-02-01', endDate: '2025-12-20', rent: 3200, deposit: 6400, paymentCycle: 3, remark: '上一任已退租' }),
      normalizeOccupancy({ id: 'oc_r3_now', kind: 'lease', status: 'active', tenant: '陈先生', phone: '13911112222', idCard: '310101199305155678', startDate: '2026-01-01', endDate: '2026-12-31', rent: 3400, deposit: 6800, paymentCycle: 6, remark: '当前长租合同' }),
    ]
    r3.activeOccupancyId = 'oc_r3_now'
    r3.history = [
      { id: 'h_r3_1', type: 'checkin', date: '2026-01-01 09:40', remark: '办理入住并确认首期收款' },
      { id: 'h_r3_2', type: 'meter', date: '2026-03-31 18:12', remark: '录入抄表并生成 3 月水电杂费' },
      { id: 'h_r3_3', type: 'writeoff', date: '2026-04-01 20:16', remark: '记收 2026-03 水电杂费 ￥186.5' },
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
      idCard: normalizeAttachmentFile({ name: '赵女士_身份证.jpg', uploadedAt: '2025-12-15 10:38', previewText: '身份证归档影像（模拟）' }),
      contract: normalizeAttachmentFile({ name: 'N304_租约扫描件.pdf', uploadedAt: '2025-12-15 10:41', previewText: '合同扫描件（模拟）' }),
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
      normalizeOccupancy({ id: 'oc_r4_now', kind: 'lease', status: 'active', tenant: '赵女士', phone: '13688887777', idCard: '430101199211123456', startDate: '2025-12-15', endDate: '2026-12-14', rent: 3600, deposit: 7200, paymentCycle: 3, remark: '连续欠费测试场景' }),
    ]
    r4.activeOccupancyId = 'oc_r4_now'
    r4.history = [
      { id: 'h_r4_1', type: 'rent_writeoff', date: '2025-12-15 11:02', remark: '记收房租 第1期 ￥10800' },
      { id: 'h_r4_2', type: 'meter', date: '2026-03-31 21:08', remark: '录入抄表并生成未结清水电杂费' },
      { id: 'h_r4_3', type: 'custom_charge', date: '2026-04-02 10:20', remark: '新增灵活收费: 保洁补收费 ￥120' },
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
      idCard: normalizeAttachmentFile({ name: '韩先生_身份证.jpg', uploadedAt: '2026-01-10 09:01', previewText: '身份证影像（模拟）' }),
      contract: normalizeAttachmentFile({ name: 'A502_电子合同.pdf', uploadedAt: '2026-01-10 09:06', previewText: '电子合同存档（模拟）' }),
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
      { id: 'h_r11_1', type: 'writeoff', date: '2026-03-28 19:00', remark: '记收 2026-03 水电杂费 ￥132.4' },
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
      { id: 'h_r16_1', type: 'checkout', date: '2026-02-28 12:10', remark: '上任租客退租，已清空账单和抄表' },
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
      { id: 'h_r19_1', type: 'checkin', date: '2026-01-08 10:00', remark: '已入住，合同扫描件待补传' },
    ]
  }

  return tree
}

const seedProperties = hydrateScenarioData(normalizePropertyTree([
  {
    id: 'p1',
    name: '江南别院 (高端)',
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
                    remark: '签约入住(半年付)',
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
                    tenant: '林女士(前任)',
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
                    remark: '空置中(待招租)',
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
                  { id: 'oc_a403_prev', kind: 'lease', status: 'completed', tenant: '上一任租客', startDate: '2025-09-01', endDate: '2026-02-28', rent: 2000, deposit: 4000, paymentCycle: 3, remark: '退租(模拟)' },
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
]))

function loadStoredProperties() {
  try {
    const stored = uni.getStorageSync(PROPERTIES_STORAGE_KEY)
    if (!stored) return cloneDeep(seedProperties)
    return normalizePropertyTree(stored)
  } catch {
    return cloneDeep(seedProperties)
  }
}

function saveStoredProperties(next) {
  try {
    uni.setStorageSync(PROPERTIES_STORAGE_KEY, cloneDeep(next))
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
    const stored = uni.getStorageSync(GLOBAL_CONFIG_STORAGE_KEY)
    return stored ? { ...fallback, ...stored } : fallback
  } catch {
    return fallback
  }
}

export const properties = ref(loadStoredProperties())

export const globalConfig = ref(loadStoredGlobalConfig())

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
      return '已租约'
    case 'empty':
    default:
      return '空置中'
  }
}

export function buildRoomReminderText(room) {
  const tenant = room.tenant || '租客'
  const dueDate = room.nextDueDate ? `截止 ${room.nextDueDate}` : '请尽快'
  const amount = room.nextDueAmount || (room.rent ? room.rent * (room.paymentCycle || 1) : 0)
  const type = room.status === 'overdue' ? '已逾期' : '本期'
  return `${tenant}你好，${room.roomNo} ${type}房租应缴 ￥${amount}，${dueDate}。收到请回复，谢谢。`
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

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value))
}
