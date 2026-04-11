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
                          isHighlighted(room.status) ? 'opacity-100' : 'opacity-20 scale-90 grayscale',
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
                          roomVisuals(room.status).bg,
                          roomVisuals(room.status).border,
                          editMode ? 'min-h-roomcard-edit' : 'min-h-roomcard',
                          !editMode && !isHighlighted(room.status) ? 'opacity-30 grayscale' : 'opacity-100',
                        ]"
                        @click="handleRoomClick(block.id, room)"
                      >
                        <view class="flex justify-between items-start mb-1">
                          <text class="font-bold text-sm font-mono" :class="roomVisuals(room.status).text">
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
                            <view class="text-xs font-medium truncate" :class="roomVisuals(room.status).text">
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
import { getPageHeaderTopPadding } from '../../utils/layout'
import {
  applyWorkbenchStructureChange,
  buildWorkbenchStats,
  countRooms,
  createWorkbenchModalState,
  getRoomStatusDot,
  getRoomVisuals,
  isRoomHighlighted,
  openWorkbenchModal,
  removeWorkbenchRoom,
} from './useWorkbenchStructure'

const activePropertyId = ref(properties.value[0]?.id || '')
const filterStatus = ref('all')
const editMode = ref(false)
const headerTopPadding = ref(44)
const inputValue = ref('')
const uiText = {
  newProperty: '+ 新建院落',
  newBlock: '新建楼栋',
  newFloor: '+ 加盖新楼层',
  newRoom: '+ 房间',
  finishManage: '完成管理',
  structureManage: '结构管理',
  confirmAdd: '确认添加',
  finishIcon: '✓',
  manageIcon: '✦',
}
const addModal = ref(createWorkbenchModalState())

onLoad(() => {
  headerTopPadding.value = getPageHeaderTopPadding(44)
})

const activeProperty = computed(() => properties.value.find((item) => item.id === activePropertyId.value))
const stats = computed(() => buildWorkbenchStats(activeProperty.value))

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

function isHighlighted(status) {
  return isRoomHighlighted(filterStatus.value, status)
}

function roomVisuals(status) {
  return getRoomVisuals(status, editMode.value)
}

function roomStatusDot(status) {
  return getRoomStatusDot(status)
}

function handleRoomClick(blockId, room) {
  if (editMode.value) return
  const page = room.status === 'empty' ? 'checkin' : 'detail'
  safeNavigateTo(`/pages/room/${page}?propertyId=${activePropertyId.value}&blockId=${blockId}&roomId=${room.id}`)
}

function goBlock(blockId) {
  if (editMode.value) return
  safeNavigateTo(`/pages/block/detail?propertyId=${activePropertyId.value}&blockId=${blockId}`)
}

function openAddModal(type, payload = {}) {
  const nextModal = openWorkbenchModal(type, payload)
  if (!nextModal) return
  addModal.value = nextModal
  inputValue.value = ''
}

function closeAddModal() {
  addModal.value = createWorkbenchModalState()
  inputValue.value = ''
}

function handleAddSubmit() {
  const nextProperties = cloneProperties()
  const result = applyWorkbenchStructureChange(nextProperties, activePropertyId.value, addModal.value, inputValue.value)
  if (result.error) {
    uni.showToast({ title: result.error, icon: 'none' })
    return
  }

  setProperties(nextProperties)
  if (result.nextPropertyId) {
    activePropertyId.value = result.nextPropertyId
  }
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
      const removed = removeWorkbenchRoom(nextProperties, activePropertyId.value, blockId, floor, roomId)
      if (!removed) return

      setProperties(nextProperties)
      uni.showToast({ title: '房间已删除', icon: 'none' })
    },
  })
}
</script>
