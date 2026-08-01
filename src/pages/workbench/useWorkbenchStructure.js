import { createDefaultFloor, createDefaultRoom, generateId, getDefaultRoomNo, getFloorDisplayName } from '../../domain/rent-models.js'

export const PROPERTY_LIMIT = 3

export const WORKBENCH_MODAL_CONFIG = {
  property: {
    title: '新建院落',
    hint: '录入新的房产项目或院落名称。',
    placeholder: '例如：江南别院（高端）',
    inputType: 'text',
  },
  block: {
    title: '新建楼栋',
    hint: '在当前院落下新增一栋楼。',
    placeholder: '例如：北区主楼',
    inputType: 'text',
  },
  floor: {
    title: '新增楼层',
    hint: '填写楼层号和初始房间数量，系统会自动生成递增房号。',
    placeholder: '例如：3',
    inputType: 'number',
  },
  room: {
    title: '批量新增房间',
    hint: '支持逗号分隔或范围输入，例如 301,302 或 301-312。',
    placeholder: '请输入房号，例如 301,302,303 或 301-312',
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
    roomCount: '1',
  }
}

export function createQuickBuildState() {
  return {
    open: false,
    blockName: '',
    floorCount: '6',
    hasBasement: false,
    floorRooms: [],
    floorRowsReady: false,
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
    if (nextProperties.length >= PROPERTY_LIMIT) {
      return { error: `最多支持创建 ${PROPERTY_LIMIT} 个院落` }
    }
    const propertyId = generateId('p')
    nextProperties.push({
      id: propertyId,
      name: value,
      blocks: [
        {
          id: generateId('b'),
          name: '主楼',
          floors: [createDefaultFloor(1)],
        },
      ],
    })
    return { nextProperties, nextPropertyId: propertyId }
  }

  if (modal.type === 'block') {
    nextProperties[propertyIndex].blocks.push({
      id: generateId('b'),
      name: value,
      floors: [createDefaultFloor(1)],
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
    const roomCount = Number(modal.roomCount || 1)
    if (!Number.isInteger(roomCount) || roomCount <= 0) {
      return { error: '请填写有效房间数量' }
    }
    const nextFloor = createDefaultFloor(floorNumber)
    nextFloor.rooms = Array.from({ length: roomCount }, (_, index) => createDefaultRoom(getDefaultRoomNo(floorNumber, index + 1)))
    block.floors.unshift(nextFloor)
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
      added += 1
    }

    if (added === 0) {
      return { error: '房间已存在，无需重复添加' }
    }
  }

  return { nextProperties }
}

export function applyQuickBuild(nextProperties, activePropertyId, payload) {
  const property = nextProperties.find((item) => item.id === activePropertyId)
  if (!property) return { error: '当前院落不存在' }

  const blockName = String(payload.blockName || '').trim()
  const floorCount = Number(payload.floorCount || 0)

  if (!blockName) return { error: '请填写楼栋名称' }
  if (!Number.isInteger(floorCount) || floorCount <= 0) return { error: '请填写有效楼层数' }
  if (!payload.floorRowsReady) return { error: '请先生成逐层房间数' }

  if (property.blocks.some((item) => item.name === blockName)) {
    return { error: '同名楼栋已存在' }
  }

  const floors = []
  const roomRows = Array.isArray(payload.floorRooms) ? payload.floorRooms : []
  const floorNumbers = payload.hasBasement
    ? Array.from({ length: floorCount }, (_, index) => floorCount - index - 1)
    : Array.from({ length: floorCount }, (_, index) => floorCount - index)
  for (const floor of floorNumbers) {
    const row = roomRows.find((item) => Number(item?.floor) === floor)
    const roomsPerFloor = Number(row?.rooms || 0)
    if (!Number.isInteger(roomsPerFloor) || roomsPerFloor <= 0) return { error: `请填写 ${getFloorDisplayName(floor)} 房间数` }
    const rooms = []
    for (let index = 0; index < roomsPerFloor; index += 1) {
      const roomNo = getDefaultRoomNo(floor, index + 1)
      rooms.push(createDefaultRoom(roomNo))
    }
    floors.push({ floor, name: getFloorDisplayName(floor), rooms })
  }

  property.blocks.push({
    id: generateId('b'),
    name: blockName,
    floors,
  })

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

export function removeWorkbenchFloor(nextProperties, activePropertyId, blockId, floor) {
  const property = nextProperties.find((item) => item.id === activePropertyId)
  const block = property?.blocks?.find((item) => item.id === blockId)
  if (!block) return false
  const before = Array.isArray(block.floors) ? block.floors.length : 0
  block.floors = (block.floors || []).filter((item) => item.floor !== floor)
  return block.floors.length !== before
}

export function removeWorkbenchBlock(nextProperties, activePropertyId, blockId) {
  const property = nextProperties.find((item) => item.id === activePropertyId)
  if (!property) return false
  property.blocks = (property.blocks || []).filter((item) => item.id !== blockId)
  return true
}

export function removeWorkbenchProperty(nextProperties, activePropertyId) {
  const next = nextProperties.filter((item) => item.id !== activePropertyId)
  if (next.length === nextProperties.length) return { removed: false, nextPropertyId: activePropertyId }
  nextProperties.splice(0, nextProperties.length, ...next)
  return { removed: true, nextPropertyId: next[0]?.id || '' }
}

export function expandRoomInputs(raw) {
  const tokens = String(raw || '')
    .split(/[\s,，；、\n\r\t]+/g)
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
  if (token.includes('..') || token.includes('—')) {
    const parts = token.split(token.includes('..') ? '..' : '—').map((item) => item.trim())
    if (parts.length !== 2) return [token]
    return expandRange(parts[0], parts[1]) || [token]
  }

  const pureNumRange = token.match(/^(\d+)\s*[-~－]\s*(\d+)$/)
  if (pureNumRange) {
    return expandRange(pureNumRange[1], pureNumRange[2]) || [token]
  }

  const alphaRange = token.match(/^([A-Za-z]+)(\d+)\s*[-~－]\s*([A-Za-z]+)(\d+)$/)
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
