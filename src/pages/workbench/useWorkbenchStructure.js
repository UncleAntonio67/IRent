import { createDefaultRoom, generateId } from '../../domain/rent-models'

export const WORKBENCH_MODAL_CONFIG = {
  property: {
    title: '新建院落',
    hint: '录入新的房产或院落名称',
    placeholder: '例如：江南别院（高端）',
    inputType: 'text',
  },
  block: {
    title: '新建楼栋',
    hint: '在当前院落下新增一栋楼',
    placeholder: '例如：北区主楼',
    inputType: 'text',
  },
  floor: {
    title: '加盖新楼层',
    hint: '输入楼层号，系统会自动排序',
    placeholder: '例如：3',
    inputType: 'number',
  },
  room: {
    title: '批量新增房间',
    hint: '支持逗号分隔或范围输入，例如 301,302 或 301-312',
    placeholder: '请输入房号，支持批量：301,302,303 或 301-312',
    inputType: 'text',
  },
}

export function createWorkbenchModalState() {
  return {
    open: false,
    type: '',
    title: '',
    hint: '',
    placeholder: '',
    inputType: 'text',
    blockId: null,
    floor: null,
  }
}

export function buildWorkbenchStats(property) {
  const rooms = (property?.blocks || []).flatMap((block) => (block.floors || []).flatMap((floor) => floor.rooms || []))
  return {
    totalRooms: rooms.length,
    emptyRooms: rooms.filter((room) => room.status === 'empty').length,
    overdueRooms: rooms.filter((room) => room.status === 'overdue').length,
    dueSoonRooms: rooms.filter((room) => room.status === 'due_soon').length,
  }
}

export function countRooms(block, status) {
  const rooms = (block?.floors || []).flatMap((floor) => floor.rooms || [])
  if (!status) return rooms.length
  return rooms.filter((room) => room.status === status).length
}

export function isRoomHighlighted(filterStatus, roomStatus) {
  return filterStatus === 'all' || filterStatus === roomStatus || (filterStatus === 'rented' && roomStatus === 'due_soon')
}

export function getRoomVisuals(status, editMode) {
  if (editMode) {
    return {
      bg: 'bg-white',
      border: 'border-slate-300 border-dashed',
      text: 'text-slate-600',
    }
  }

  switch (status) {
    case 'rented':
      return { bg: 'bg-white', border: 'border-slate-200', text: 'text-emerald-600' }
    case 'empty':
      return { bg: 'bg-white', border: 'border-slate-300 border-dashed', text: 'text-slate-400' }
    case 'overdue':
      return { bg: 'bg-rose-50-30', border: 'border-rose-200', text: 'text-rose-600' }
    case 'due_soon':
      return { bg: 'bg-amber-50-30', border: 'border-amber-200', text: 'text-amber-600' }
    default:
      return { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-700' }
  }
}

export function getRoomStatusDot(status) {
  switch (status) {
    case 'overdue':
      return 'bg-rose-500'
    case 'due_soon':
      return 'bg-amber-400'
    case 'rented':
      return 'bg-emerald-400'
    default:
      return 'bg-slate-200'
  }
}

export function openWorkbenchModal(type, payload = {}) {
  const config = WORKBENCH_MODAL_CONFIG[type]
  if (!config) return null

  return {
    open: true,
    type,
    title: config.title,
    hint: config.hint,
    placeholder: config.placeholder,
    inputType: config.inputType,
    blockId: payload.blockId || null,
    floor: payload.floor || null,
  }
}

export function applyWorkbenchStructureChange(nextProperties, activePropertyId, modal, rawValue) {
  const value = String(rawValue || '').trim()
  if (!value) {
    return { error: '请输入内容' }
  }

  const propertyIndex = nextProperties.findIndex((item) => item.id === activePropertyId)
  if (modal.type !== 'property' && propertyIndex < 0) {
    return { error: '当前院落不存在' }
  }

  if (modal.type === 'property') {
    const propertyId = generateId('p')
    nextProperties.push({
      id: propertyId,
      name: value,
      blocks: [
        {
          id: generateId('b'),
          name: '主楼',
          floors: [{ floor: 1, rooms: [createDefaultRoom('101')] }],
        },
      ],
    })
    return { nextProperties, nextPropertyId: propertyId }
  }

  if (modal.type === 'block') {
    nextProperties[propertyIndex].blocks.push({
      id: generateId('b'),
      name: value,
      floors: [{ floor: 1, rooms: [createDefaultRoom('101')] }],
    })
    return { nextProperties }
  }

  if (modal.type === 'floor') {
    const block = nextProperties[propertyIndex].blocks.find((item) => item.id === modal.blockId)
    const floorNumber = Number(value)
    if (!block || Number.isNaN(floorNumber)) {
      return { error: '楼层号无效' }
    }
    if (block.floors.some((item) => item.floor === floorNumber)) {
      return { error: '该楼层已存在' }
    }
    block.floors.unshift({
      floor: floorNumber,
      rooms: [createDefaultRoom(`${floorNumber}01`)],
    })
    block.floors.sort((a, b) => b.floor - a.floor)
    return { nextProperties }
  }

  if (modal.type === 'room') {
    const block = nextProperties[propertyIndex].blocks.find((item) => item.id === modal.blockId)
    const floorItem = block?.floors.find((item) => item.floor === modal.floor)
    if (!floorItem) {
      return { error: '目标楼层不存在' }
    }

    const roomNos = expandRoomInputs(value)
    if (roomNos.length === 0) {
      return { error: '未识别到房间号' }
    }

    const existing = new Set(floorItem.rooms.map((item) => item.roomNo))
    let added = 0
    for (const roomNo of roomNos) {
      if (existing.has(roomNo)) continue
      floorItem.rooms.push(createDefaultRoom(roomNo))
      existing.add(roomNo)
      added++
    }

    if (added === 0) {
      return { error: '房间已存在，无需重复添加' }
    }
  }

  return { nextProperties }
}

export function removeWorkbenchRoom(nextProperties, activePropertyId, blockId, floor, roomId) {
  const propertyIndex = nextProperties.findIndex((item) => item.id === activePropertyId)
  if (propertyIndex < 0) return false

  const block = nextProperties[propertyIndex].blocks.find((item) => item.id === blockId)
  const floorItem = block?.floors.find((item) => item.floor === floor)
  if (!floorItem) return false

  floorItem.rooms = floorItem.rooms.filter((item) => item.id !== roomId)
  return true
}

export function expandRoomInputs(raw) {
  const tokens = String(raw || '')
    .split(/[\s,，;；、\n\r\t]+/g)
    .map((token) => token.trim())
    .filter(Boolean)

  const expanded = []
  for (const token of tokens) {
    expanded.push(...expandOneToken(token))
  }

  const seen = new Set()
  return expanded.filter((roomNo) => {
    if (seen.has(roomNo)) return false
    seen.add(roomNo)
    return true
  })
}

function expandOneToken(token) {
  if (token.includes('..') || token.includes('…')) {
    const parts = token.split(token.includes('..') ? '..' : '…').map((item) => item.trim())
    if (parts.length !== 2) return [token]
    return expandRange(parts[0], parts[1]) || [token]
  }

  const pureNumRange = token.match(/^(\d+)\s*[-~—]\s*(\d+)$/)
  if (pureNumRange) {
    return expandRange(pureNumRange[1], pureNumRange[2]) || [token]
  }

  const alphaRange = token.match(/^([A-Za-z]+)(\d+)\s*[-~—]\s*([A-Za-z]+)(\d+)$/)
  if (alphaRange && alphaRange[1] === alphaRange[3]) {
    return expandRange(`${alphaRange[1]}${alphaRange[2]}`, `${alphaRange[3]}${alphaRange[4]}`) || [token]
  }

  return [token]
}

function expandRange(start, end) {
  const from = splitPrefixNumber(start)
  const to = splitPrefixNumber(end)
  if (!from || !to || from.prefix !== to.prefix) return null

  const fromNum = Number(from.num)
  const toNum = Number(to.num)
  if (!Number.isFinite(fromNum) || !Number.isFinite(toNum)) return null
  if (fromNum === toNum) return [start]

  const width = Math.max(from.num.length, to.num.length)
  const step = fromNum < toNum ? 1 : -1
  const result = []
  for (let value = fromNum; step > 0 ? value <= toNum : value >= toNum; value += step) {
    result.push(`${from.prefix}${String(value).padStart(width, '0')}`)
  }
  return result
}

function splitPrefixNumber(input) {
  const match = String(input || '').trim().match(/^(.*?)(\d+)$/)
  if (!match) return null
  return { prefix: match[1], num: match[2] }
}
