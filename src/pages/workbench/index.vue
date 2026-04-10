<template>
  <view class="min-h-screen bg-slate-50 text-slate-800">
    <view class="mx-auto max-w-md min-h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-hidden">
      <view
        class="bg-white-80 border-b px-5 pb-3 relative shrink-0 border-slate-200-60 z-20 shadow-soft sticky-header"
        :style="{ paddingTop: headerTopPadding + 'px' }"
      >
                <view
          v-if="editMode"
          class="absolute top-0 left-0 right-0 h-10 bg-amber-500 flex items-center justify-center text-amber-50 text-xs font-bold gap-2 animate-in fade-in"
        >
          <text>结构管理模式已开启</text>
        </view>

        <view class="flex items-center gap-3 transition-all" :class="editMode ? 'mt-2' : ''">
          <view
            class="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-soft"
            :class="editMode ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-blue-50-50 border-blue-100 text-blue-600'"
          >
            <text class="text-lg font-black">房</text>
          </view>
          <view>
            <view class="font-black text-slate-800 text-lg leading-tight">房态工作台</view>
            <view class="text-xs text-slate-400 font-medium mt-0_5">
              共 {{ stats.totalRooms }} 间
              <text class="mx-1 text-slate-200">|</text>
              空置 {{ stats.emptyRooms }}
            </view>
          </view>
        </view>

        <scroll-view v-if="!editMode" scroll-x class="mt-4" show-scrollbar="false">
          <view class="flex gap-2 pb-1">
            <button
              class="whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'all' ? 'btn-slate' : 'chip-soft text-slate-600'"
              @click="setFilter('all')"
            >
              全部
            </button>
            <button
              class="whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'overdue' ? 'bg-rose-500 text-white shadow-md' : 'bg-rose-50 text-rose-600'"
              @click="setFilter('overdue')"
            >
              <view class="size-1_5 rounded-full" :class="filterStatus === 'overdue' ? 'bg-white' : 'bg-rose-500'"></view>
              欠费 {{ stats.overdueRooms }}
            </button>
            <button
              class="whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'due_soon' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-50 text-amber-600'"
              @click="setFilter('due_soon')"
            >
              <view class="size-1_5 rounded-full" :class="filterStatus === 'due_soon' ? 'bg-white' : 'bg-amber-500'"></view>
              临收 {{ stats.dueSoonRooms }}
            </button>
            <button
              class="whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'rented' ? 'bg-emerald-500 text-white shadow-md' : 'bg-emerald-50 text-emerald-600'"
              @click="setFilter('rented')"
            >
              <view class="size-1_5 rounded-full" :class="filterStatus === 'rented' ? 'bg-white' : 'bg-emerald-500'"></view>
              已租
            </button>
            <button
              class="whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'empty' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-500'"
              @click="setFilter('empty')"
            >
              <view class="size-1_5 rounded-full" :class="filterStatus === 'empty' ? 'bg-white' : 'bg-slate-400'"></view>
              空置
            </button>
          </view>
        </scroll-view>

<scroll-view scroll-x class="mt-4" show-scrollbar="false">
          <view class="flex items-center gap-2 pb-1">
            <button
              v-for="property in properties"
              :key="property.id"
              class="whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all"
              :class="property.id === activePropertyId ? 'btn-slate' : 'chip-soft text-slate-500'"
              @click="switchProperty(property.id)"
            >
              {{ property.name }}
            </button>
            <button
              v-if="editMode"
              class="whitespace-nowrap px-3 py-2 rounded-xl text-sm font-bold btn-soft text-blue-600"
              @click="openAddModal('property')"
            >
              {{ uiText.newProperty }}
            </button>
          </view>
        </scroll-view>
      </view>
      <scroll-view scroll-y class="page-scroll" :scroll-with-animation="true">
        <view class="p-5 stack-5" style="padding-bottom: 168rpx;">
          <view v-if="activeProperty" class="relative mt-2">
            <view v-if="!editMode" class="stack-4 animate-in fade-in duration-300">
              <view
                v-for="block in activeProperty.blocks"
                :key="block.id"
                class="p-4 cursor-pointer transition-all tap-scale surface-card"
                :class="UI.card"
                @click="goBlock(block.id)"
              >
                <view class="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <view class="flex items-center gap-3">
                    <view class="w-10 h-10 bg-blue-50-50 rounded-xl flex items-center justify-center text-blue-600">
                      <text class="text-base font-black">楼</text>
                    </view>
                    <view>
                      <view class="font-bold text-slate-800 text-base">{{ block.name }}</view>
                      <view class="text-xs text-slate-400 font-medium mt-0_5">
                        共 {{ countRooms(block) }} 间
                        <text class="mx-1 text-slate-200">|</text>
                        空置 {{ countRooms(block, 'empty') }}
                      </view>
                    </view>
                  </view>
                  <view class="text-xs text-slate-500 font-bold">查看</view>
                </view>

                <view class="stack-2">
                  <view v-for="floorItem in block.floors" :key="floorItem.floor" class="flex items-center gap-3">
                    <view class="w-5 text-right text-2xs font-bold text-slate-400">F{{ floorItem.floor }}</view>
                    <view class="flex-1 flex flex-wrap gap-1_5">
                      <view
                        v-for="room in floorItem.rooms"
                        :key="room.id"
                        class="w-3 h-4 rounded-sm transition-all duration-300"
                        :class="[
                          getMiniStatusColor(room.status),
                          isRoomHighlighted(room.status) ? 'opacity-100' : 'opacity-20 scale-90 grayscale',
                        ]"
                      ></view>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <view v-else class="stack-6 animate-in fade-in duration-300">
              <view
                v-for="block in activeProperty.blocks"
                :key="block.id"
                class="overflow-hidden relative"
                :class="UI.card"
              >
                <view v-if="editMode" class="bg-slate-100-50 p-3 font-bold text-slate-800 text-center border-b border-slate-100">
                  {{ block.name }}
                </view>

                <view
                  v-if="editMode"
                  class="m-4 bg-white border border-blue-200 border-dashed text-blue-600 py-3 rounded-xl flex justify-center items-center gap-2 font-bold tap-scale"
                  @click.stop="openAddModal('floor', { blockId: block.id })"
                >
                  <text>{{ uiText.newFloor }}</text>
                </view>

                <view v-if="block.floors.length === 0" class="py-12 text-center text-slate-400 font-medium">
                  暂无楼层
                </view>

                <view v-else>
                  <view
                    v-for="(floorItem, floorIndex) in block.floors"
                    :key="floorItem.floor"
                    class="flex flex-col"
                    :class="floorIndex > 0 ? 'border-t border-slate-100' : ''"
                  >
                    <view class="bg-slate-50-50 px-4 py-2 flex items-center justify-between border-b border-slate-100">
                      <text class="font-black text-slate-400 text-sm">F {{ floorItem.floor }}</text>
                    </view>

                    <view class="p-4 grid grid-cols-3 gap-2 bg-slate-50-50">
                      <view
                        v-for="room in floorItem.rooms"
                        :key="room.id"
                        class="relative rounded-xl p-2 border shadow-roomcard transition-all flex flex-col justify-between room-card-compact"
                        :class="[
                          getRoomVisuals(room.status).bg,
                          getRoomVisuals(room.status).border,
                          editMode ? 'min-h-roomcard-edit' : 'min-h-roomcard',
                          !editMode && !isRoomHighlighted(room.status) ? 'opacity-30 grayscale' : 'opacity-100',
                        ]"
                        @click="handleRoomClick(block.id, room)"
                      >
                        <view class="flex justify-between items-start mb-1">
                          <text class="font-bold text-sm font-mono" :class="getRoomVisuals(room.status).text">
                            {{ room.roomNo }}
                          </text>
                          <view
                            v-if="editMode"
                            class="delete-corner-button"
                            @click.stop="removeRoom(block.id, floorItem.floor, room.id)"
                          ><text>x</text></view>
                          <view v-else class="w-2 h-2 rounded-full mt-1_5" :class="roomStatusDot(room.status)"></view>
                        </view>

                        <view v-if="!editMode">
                          <view v-if="room.status === 'empty'" class="text-2xs font-medium text-slate-400 mt-2">空置待租</view>
                          <view v-else>
                            <view class="text-xs font-medium truncate" :class="getRoomVisuals(room.status).text">
                              {{ room.tenant || '租客未录入' }}
                            </view>
                            <view v-if="room.status === 'overdue'" class="text-2xs text-rose-600 font-bold mt-1 inline-block">
                              欠费待收
                            </view>
                            <view v-else class="text-2xs text-slate-500 font-mono mt-1 opacity-70">
                              ￥{{ room.rent }}/期
                            </view>
                          </view>
                        </view>
                      </view>

                      <view
                        v-if="editMode"
                        class="room-create-tile"
                        @click.stop="openAddModal('room', { blockId: block.id, floor: floorItem.floor })"
                      >
                        <view class="room-create-plus">+</view>
                        <text class="room-create-label">新建房间</text>
                      </view>

                    </view>
                  </view>
                </view>
              </view>

              <view
                v-if="editMode"
                class="block-create-card"
                @click="openAddModal('block')"
              >
                <view class="block-create-plus">+</view>
                <view class="block-create-copy">
                  <view class="block-create-title">新建楼栋</view>
                  <view class="block-create-hint">在当前院落中继续添加楼栋</view>
                </view>
              </view>

            </view>
          </view>
        </view>
      </scroll-view>

      <view v-if="!addModal.open" class="fixed right-5 bottom-24 z-30 stack-3 items-end">
        <button
          class="px-4 py-3 rounded-full text-sm font-black tap-scale shadow-roomcard flex items-center gap-2"
          :class="editMode ? 'btn-amber' : 'btn-slate'"
          @click="toggleEditMode"
        >
          <text class="text-base leading-none">{{ editMode ? uiText.finishIcon : uiText.manageIcon }}</text>
          <text>{{ editMode ? uiText.finishManage : uiText.structureManage }}</text>
        </button>
      </view>

      <view
        v-if="addModal.open"
        class="fixed inset-0 z-50 bg-slate-900-45 flex items-center justify-center px-5"
        @click="closeAddModal"
      >
        <view class="w-full max-w-md bg-white rounded-3xl p-5 stack-4 shadow-top-soft modal-sheet modal-sheet-center surface-card" @click.stop>
          <view class="flex items-start justify-between gap-3">
            <view class="min-w-0 flex items-start gap-3">
              <view class="w-11 h-11 rounded-2xl bg-blue-50-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <text class="text-base font-black">+</text>
              </view>
              <view class="min-w-0">
                <view class="text-lg font-black text-slate-800 leading-tight">{{ addModal.title }}</view>
                <view class="text-xs text-slate-400 mt-1 leading-5">{{ addModal.hint }}</view>
              </view>
            </view>
            <button class="drawer-icon-button tap-scale" @click="closeAddModal">
              <view class="icon-close">
                <view class="icon-close-line"></view>
                <view class="icon-close-line icon-close-line-second"></view>
              </view>
            </button>
          </view>

          <textarea
            v-if="addModal.type === 'room'"
            v-model="inputValue"
            :placeholder="addModal.placeholder"
            class="w-full px-4 py-4 input-soft rounded-2xl font-medium text-slate-800 modal-textarea"
            auto-height
            maxlength="-1"
          />
          <input
            v-else
            v-model="inputValue"
            :type="addModal.inputType"
            :placeholder="addModal.placeholder"
            class="w-full px-4 py-4 input-soft rounded-xl font-medium text-slate-800 modal-input"
            confirm-type="done"
            @confirm="handleAddSubmit"
          />

          <button class="w-full py-4 rounded-xl btn-blue font-bold" @click="handleAddSubmit">{{ uiText.confirmAdd }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { UI, getMiniStatusColor } from '../../ui/ui'
import { properties, cloneProperties, setProperties } from '../../data/rentStore'
import { safeNavigateTo } from '../../utils/navigation'

const activePropertyId = ref(properties.value[0].id)
const filterStatus = ref('all')
const editMode = ref(false)
const headerTopPadding = ref(44)
const inputValue = ref('')
const uiText = {
  newProperty: '\u002b \u65b0\u5efa\u9662\u843d',
  newBlock: '\u65b0\u5efa\u697c\u680b',
  newFloor: '\u002b \u52a0\u76d6\u65b0\u697c\u5c42',
  newRoom: '\u002b \u623f\u95f4',
  finishManage: '\u5b8c\u6210\u7ba1\u7406',
  structureManage: '\u7ed3\u6784\u7ba1\u7406',
  close: '\u5173\u95ed',
  confirmAdd: '\u786e\u8ba4\u6dfb\u52a0',
  finishIcon: '\u2713',
  manageIcon: '\u2726',
}
const modalConfig = {
  property: {
    title: '\u65b0\u5efa\u9662\u843d',
    hint: '\u5f55\u5165\u65b0\u7684\u623f\u4ea7\u6216\u9662\u843d\u540d\u79f0',
    placeholder: '\u4f8b\u5982\uff1a\u6c5f\u5357\u522b\u9662\uff08\u9ad8\u7aef\uff09',
    inputType: 'text',
  },
  block: {
    title: '\u65b0\u5efa\u697c\u680b',
    hint: '\u5728\u5f53\u524d\u9662\u843d\u4e0b\u65b0\u589e\u4e00\u680b\u697c',
    placeholder: '\u4f8b\u5982\uff1a\u5317\u533a\u4e3b\u697c',
    inputType: 'text',
  },
  floor: {
    title: '\u52a0\u76d6\u65b0\u697c\u5c42',
    hint: '\u8f93\u5165\u697c\u5c42\u53f7\uff0c\u7cfb\u7edf\u4f1a\u81ea\u52a8\u6392\u5e8f',
    placeholder: '\u4f8b\u5982\uff1a3',
    inputType: 'number',
  },
  room: {
    title: '\u6279\u91cf\u65b0\u589e\u623f\u95f4',
    hint: '\u652f\u6301\u9017\u53f7\u5206\u9694\u6216\u8303\u56f4\u8f93\u5165\uff0c\u4f8b\u5982 301,302 \u6216 301-312',
    placeholder: '\u8bf7\u8f93\u5165\u623f\u53f7\uff0c\u652f\u6301\u6279\u91cf\uff1a301,302,303 \u6216 301-312',
    inputType: 'text',
  },
}
const addModal = ref({
  open: false,
  type: '',
  title: '',
  hint: '',
  placeholder: '',
  inputType: 'text',
  blockId: null,
  floor: null,
})

onLoad(() => {
  try {
    const sys = uni.getSystemInfoSync()
    headerTopPadding.value = Math.max(44, (sys.statusBarHeight || 20) + 12)
  } catch {
    headerTopPadding.value = 44
  }
})

const activeProperty = computed(() => properties.value.find((item) => item.id === activePropertyId.value))

const stats = computed(() => {
  const rooms = (activeProperty.value?.blocks || []).flatMap((block) => block.floors.flatMap((floor) => floor.rooms))
  return {
    totalRooms: rooms.length,
    emptyRooms: rooms.filter((room) => room.status === 'empty').length,
    overdueRooms: rooms.filter((room) => room.status === 'overdue').length,
    dueSoonRooms: rooms.filter((room) => room.status === 'due_soon').length,
  }
})

function countRooms(block, status) {
  const rooms = block.floors.flatMap((floor) => floor.rooms)
  if (!status) return rooms.length
  return rooms.filter((room) => room.status === status).length
}

function switchProperty(propertyId) {
  activePropertyId.value = propertyId
}

function setFilter(status) {
  filterStatus.value = status
}

function toggleEditMode() {
  editMode.value = !editMode.value
  filterStatus.value = 'all'
}

function isRoomHighlighted(status) {
  return filterStatus.value === 'all' || filterStatus.value === status || (filterStatus.value === 'rented' && status === 'due_soon')
}

function getRoomVisuals(status) {
  if (editMode.value) {
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

function roomStatusDot(status) {
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

function handleRoomClick(blockId, room) {
  if (editMode.value) return
  if (room.status === 'empty') {
    safeNavigateTo(`/pages/room/checkin?propertyId=${activePropertyId.value}&blockId=${blockId}&roomId=${room.id}`)
    return
  }
  safeNavigateTo(`/pages/room/detail?propertyId=${activePropertyId.value}&blockId=${blockId}&roomId=${room.id}`)
}

function goBlock(blockId) {
  if (editMode.value) return
  safeNavigateTo(`/pages/block/detail?propertyId=${activePropertyId.value}&blockId=${blockId}`)
}

function openAddModal(type, payload = {}) {
  const config = modalConfig[type]
  if (!config) return

  addModal.value = {
    open: true,
    type,
    title: config.title,
    hint: config.hint,
    placeholder: config.placeholder,
    inputType: config.inputType,
    blockId: payload.blockId || null,
    floor: payload.floor || null,
  }
  inputValue.value = ''
}

function closeAddModal() {
  addModal.value = {
    open: false,
    type: '',
    title: '',
    hint: '',
    placeholder: '',
    inputType: 'text',
    blockId: null,
    floor: null,
  }
  inputValue.value = ''
}

function createDefaultRoom(roomNo) {
  return {
    id: generateId('r'),
    roomNo,
    status: 'empty',
    tenant: '',
    rent: 1800,
  }
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

function handleAddSubmit() {
  const value = inputValue.value.trim()
  if (!value) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }

  const nextProperties = cloneProperties()
  const propertyIndex = nextProperties.findIndex((item) => item.id === activePropertyId.value)

  if (addModal.value.type === 'property') {
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
    activePropertyId.value = propertyId
  }

  if (propertyIndex < 0 && addModal.value.type !== 'property') {
    uni.showToast({ title: '当前院落不存在', icon: 'none' })
    return
  }

  if (addModal.value.type === 'block') {
    nextProperties[propertyIndex].blocks.push({
      id: generateId('b'),
      name: value,
      floors: [{ floor: 1, rooms: [createDefaultRoom('101')] }],
    })
  }

  if (addModal.value.type === 'floor') {
    const block = nextProperties[propertyIndex].blocks.find((item) => item.id === addModal.value.blockId)
    const floorNumber = Number(value)
    if (!block || Number.isNaN(floorNumber)) {
      uni.showToast({ title: '楼层号无效', icon: 'none' })
      return
    }
    const exists = block.floors.some((item) => item.floor === floorNumber)
    if (exists) {
      uni.showToast({ title: '该楼层已存在', icon: 'none' })
      return
    }
    block.floors.unshift({
      floor: floorNumber,
      rooms: [createDefaultRoom(`${floorNumber}01`)],
    })
    block.floors.sort((a, b) => b.floor - a.floor)
  }

  if (addModal.value.type === 'room') {
    const block = nextProperties[propertyIndex].blocks.find((item) => item.id === addModal.value.blockId)
    const floorItem = block?.floors.find((item) => item.floor === addModal.value.floor)
    if (!floorItem) {
      uni.showToast({ title: '目标楼层不存在', icon: 'none' })
      return
    }

    const expanded = expandRoomInputs(value)
    if (expanded.length === 0) {
      uni.showToast({ title: '未识别到房间号', icon: 'none' })
      return
    }

    const existingRoomNos = new Set(floorItem.rooms.map((item) => item.roomNo))
    let added = 0
    for (const roomNo of expanded) {
      if (existingRoomNos.has(roomNo)) continue
      floorItem.rooms.push(createDefaultRoom(roomNo))
      existingRoomNos.add(roomNo)
      added++
    }

    if (added === 0) {
      uni.showToast({ title: '房间已存在，无需重复添加', icon: 'none' })
      return
    }
  }

  setProperties(nextProperties)
  closeAddModal()
  uni.showToast({ title: '添加成功', icon: 'success' })
}

function removeRoom(blockId, floor, roomId) {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复（仅移除房间结构，不影响历史数据）。继续吗？',
    confirmText: '删除',
    cancelText: '取消',
    success: (res) => {
      if (!res.confirm) return
      const nextProperties = cloneProperties()
      const propertyIndex = nextProperties.findIndex((item) => item.id === activePropertyId.value)
      if (propertyIndex < 0) return

      const block = nextProperties[propertyIndex].blocks.find((item) => item.id === blockId)
      const floorItem = block?.floors.find((item) => item.floor === floor)
      if (!floorItem) return

      floorItem.rooms = floorItem.rooms.filter((item) => item.id !== roomId)
      setProperties(nextProperties)
      uni.showToast({ title: '房间已删除', icon: 'none' })
    },
  })
}

function expandRoomInputs(raw) {
  const tokens = raw
    .split(/[\s,，;；、\n\r\t]+/g)
    .map((t) => t.trim())
    .filter(Boolean)

  const out = []
  for (const token of tokens) {
    out.push(...expandOneToken(token))
  }

  // Deduplicate while preserving order.
  const seen = new Set()
  const unique = []
  for (const roomNo of out) {
    if (seen.has(roomNo)) continue
    seen.add(roomNo)
    unique.push(roomNo)
  }
  return unique
}

function expandOneToken(token) {
  // 1) ".." ranges: supports "3-01..3-12", "A101..A112", "301..312"
  if (token.includes('..') || token.includes('…')) {
    const parts = token.split(token.includes('..') ? '..' : '…').map((p) => p.trim())
    if (parts.length !== 2) return [token]
    return expandRange(parts[0], parts[1]) || [token]
  }

  // 2) "-" / "~" / "—" numeric ranges: "301-312"
  const pureNumRange = token.match(/^(\d+)\s*[-~—]\s*(\d+)$/)
  if (pureNumRange) {
    const start = pureNumRange[1]
    const end = pureNumRange[2]
    return expandRange(start, end) || [token]
  }

  // 3) alpha-prefix ranges: "A101-A112"
  const alphaRange = token.match(/^([A-Za-z]+)(\d+)\s*[-~—]\s*([A-Za-z]+)(\d+)$/)
  if (alphaRange && alphaRange[1] === alphaRange[3]) {
    const start = `${alphaRange[1]}${alphaRange[2]}`
    const end = `${alphaRange[3]}${alphaRange[4]}`
    return expandRange(start, end) || [token]
  }

  return [token]
}

function expandRange(start, end) {
  const s = splitPrefixNumber(start)
  const e = splitPrefixNumber(end)
  if (!s || !e) return null
  if (s.prefix !== e.prefix) return null

  const a = Number(s.num)
  const b = Number(e.num)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  if (a === b) return [start]

  const step = a < b ? 1 : -1
  const width = Math.max(s.num.length, e.num.length)
  const res = []
  for (let n = a; step > 0 ? n <= b : n >= b; n += step) {
    res.push(`${s.prefix}${String(n).padStart(width, '0')}`)
  }
  return res
}

function splitPrefixNumber(input) {
  const m = String(input).trim().match(/^(.*?)(\d+)$/)
  if (!m) return null
  return { prefix: m[1], num: m[2] }
}
</script>
