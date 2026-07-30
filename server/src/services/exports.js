import { prisma } from '../db.js'
import { putObjectText } from './r2.js'

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function buildCsv(rows) {
  return `\ufeff${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`
}

function mapBillTypeLabel(type) {
  return {
    RENT: '租金',
    WATER: '水费',
    ELECTRIC: '电费',
    GAS: '燃气',
    HEATING: '供暖',
    CUSTOM: '其他',
    DEPOSIT: '押金',
  }[String(type || '').toUpperCase()] || '其他'
}

async function findScopedRoom(roomId, tenantId) {
  return prisma.room.findFirst({
    where: {
      id: roomId,
      floor: {
        block: {
          property: { tenantId },
        },
      },
    },
    include: {
      floor: {
        include: {
          block: {
            include: {
              property: true,
            },
          },
        },
      },
      collections: {
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        include: { attachments: true },
      },
    },
  })
}

async function loadScopedRooms(scope, tenantId, roomId = null) {
  if (scope === 'room') {
    const room = await findScopedRoom(roomId, tenantId)
    if (!room) {
      const error = new Error('Room not found')
      error.statusCode = 404
      error.code = 'ROOM_NOT_FOUND'
      throw error
    }
    return [room]
  }

  return prisma.room.findMany({
    where: {
      floor: {
        block: {
          property: { tenantId },
        },
      },
    },
    orderBy: [{ roomNo: 'asc' }],
    include: {
      floor: {
        include: {
          block: {
            include: {
              property: true,
            },
          },
        },
      },
      collections: {
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        include: { attachments: true },
      },
    },
  })
}

function buildExportRows(rooms) {
  return rooms
    .flatMap((room) =>
      (room.collections || []).map((collection) => ({
        date: collection.paidAt ? collection.paidAt.toISOString().replace('T', ' ').slice(0, 16) : '',
        propertyName: room.floor?.block?.property?.name || '',
        blockName: room.floor?.block?.name || '',
        roomNo: room.roomNo || '',
        tenantName: room.tenantName || '',
        type: mapBillTypeLabel(collection.billType),
        title: collection.title || '',
        amount: Number(collection.amount || 0).toFixed(2),
        receipt: (collection.attachments || []).length > 0 ? '有' : '无',
        rawKind: String(collection.billType || '').toUpperCase(),
      }))
    )
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
}

function buildSummary(rows) {
  const rent = rows
    .filter((item) => item.rawKind === 'RENT')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const extra = rows
    .filter((item) => item.rawKind !== 'RENT')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return {
    count: rows.length,
    rent: rent.toFixed(2),
    extra: extra.toFixed(2),
  }
}

export async function createExportTask({ tenantId, userId, scope, roomId = null }) {
  const task = await prisma.exportTask.create({
    data: {
      tenantId,
      userId,
      scope,
      roomId: roomId || null,
      status: 'RUNNING',
    },
  })

  try {
    const rooms = await loadScopedRooms(scope, tenantId, roomId)
    const rows = buildExportRows(rooms)
    const summary = buildSummary(rows)

    const csvRows = [
      ['日期', '院落', '楼栋', '房间', '租客', '类型', '标题', '金额', '凭证状态'],
      ...rows.map((item) => [
        item.date,
        item.propertyName,
        item.blockName,
        item.roomNo,
        item.tenantName,
        item.type,
        item.title,
        item.amount,
        item.receipt,
      ]),
    ]

    if (rows.length > 0) {
      csvRows.push([])
      csvRows.push(['汇总', '', '', '', '', '', '流水笔数', String(summary.count), ''])
      csvRows.push(['汇总', '', '', '', '', '', '租金合计', summary.rent, ''])
      csvRows.push(['汇总', '', '', '', '', '', '附加费合计', summary.extra, ''])
    }

    const { fileUrl } = await putObjectText({
      storageKey: `${tenantId}/exports/${task.id}.csv`,
      body: buildCsv(csvRows),
      contentType: 'text/csv; charset=utf-8',
    })

    return prisma.exportTask.update({
      where: { id: task.id },
      data: {
        status: 'SUCCEEDED',
        fileUrl,
        summaryJson: summary,
      },
    })
  } catch (error) {
    await prisma.exportTask.update({
      where: { id: task.id },
      data: {
        status: 'FAILED',
        summaryJson: { message: error.message || '导出失败' },
      },
    })
    throw error
  }
}

export async function listExportTasks({ tenantId, userId }) {
  return prisma.exportTask.findMany({
    where: {
      tenantId,
      userId,
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 20,
  })
}
