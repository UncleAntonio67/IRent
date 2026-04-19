<template>
  <view class="min-h-screen bg-slate-50 text-slate-800">
    <view class="mx-auto max-w-md min-h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-hidden">
      <view class="bg-white-80 border-b px-5 pb-3 relative shrink-0 border-slate-200-60 z-20 shadow-soft sticky-header" :style="{ paddingTop: headerTopPadding + 'px' }">
        <view class="flex items-center gap-3">
          <view class="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-soft" :class="editMode ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-blue-50-50 border-blue-100 text-blue-600'">
            <text class="text-sm font-bold">房</text>
          </view>
          <view class="min-w-0">
            <view class="font-black text-slate-900 text-lg leading-tight">工作台</view>
            <view class="text-xs text-slate-400 font-medium mt-0_5">
              共 {{ stats.totalRooms }} 间<text class="mx-1 text-slate-200">|</text>
              空置 {{ stats.emptyRooms }}
            </view>
          </view>
        </view>

        <scroll-view v-if="!editMode" scroll-x class="mt-4" show-scrollbar="false">
          <view class="flex gap-2 pb-1">
            <button v-for="item in filterOptions" :key="item.value" class="whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1" :class="filterStatus === item.value ? item.activeClass : item.baseClass" @click="setFilter(item.value)">
              <view v-if="item.dotClass" class="size-1_5 rounded-full" :class="filterStatus === item.value ? 'bg-white' : item.dotClass"></view>
              {{ item.label }}
            </button>
          </view>
        </scroll-view>

        <scroll-view scroll-x class="mt-4" show-scrollbar="false">
          <view class="flex items-center gap-2 pb-1">
            <button
              v-for="property in properties"
              :key="property.id"
              class="property-chip tap-scale"
              :class="property.id === activePropertyId ? 'property-chip-active' : 'property-chip-default'"
              @click="switchProperty(property.id)"
            >
              <text class="truncate">{{ property.name }}</text>
            </button>
            <button v-if="editMode" class="property-chip property-chip-soft tap-scale" @click="openAddModal('property')">新建院落</button>
            <button v-if="editMode" class="property-chip property-chip-soft tap-scale" @click="openQuickBuildModal">快速构建</button>
            <button v-if="editMode && properties.length > 1" class="property-chip property-chip-danger tap-scale" @click="removeCurrentProperty">删除当前院落</button>
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
                      <text class="text-sm font-bold">楼</text>
                    </view>
                    <view>
                      <view class="font-bold text-slate-800 text-sm">{{ block.name }}</view>
                      <view class="text-xs text-slate-400 font-medium mt-0_5">
                        共 {{ countRooms(block) }} 间<text class="mx-1 text-slate-200">|</text>
                        空置 {{ countRooms(block, 'empty') }}
                      </view>
                    </view>
                  </view>
                  <view class="text-xs text-slate-400 font-medium">查看</view>
                </view>

                <view class="stack-2">
                  <view v-for="floorItem in block.floors" :key="floorItem.floor" class="flex items-center gap-3">
                    <view class="w-5 text-right text-2xs font-medium text-slate-400">F{{ floorItem.floor }}</view>
                    <view class="flex-1 flex flex-wrap gap-1_5">
                      <view
                        v-for="room in floorItem.rooms"
                        :key="room.id"
                        class="w-3 h-4 rounded-sm transition-all duration-300"
                        :class="[getMiniStatusColor(room.status), isHighlighted(room.status) ? 'opacity-100' : 'opacity-20 scale-90 grayscale']"
                      ></view>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <view v-else class="stack-6 animate-in fade-in duration-300">
              <view v-for="block in activeProperty.blocks" :key="block.id" class="overflow-hidden relative" :class="UI.card">
                <view class="bg-slate-100-50 px-4 py-3 flex items-center justify-between border-b border-slate-100">
                  <view class="font-bold text-slate-700 text-sm">{{ block.name }}</view>
                  <button class="px-3 py-1_5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200 tap-scale" @click.stop="removeBlock(block.id)">删除楼栋</button>
                </view>

                <view class="m-4 bg-white border border-blue-200 border-dashed text-blue-600 py-3 rounded-xl flex justify-center items-center gap-2 font-bold tap-scale" @click.stop="openAddModal('floor', { blockId: block.id })">
                  <text>+ 新增楼层</text>
                </view>

                <view v-if="block.floors.length === 0" class="py-12 text-center text-slate-400 font-medium">暂无楼层</view>

                <view v-else>
                  <view v-for="(floorItem, floorIndex) in block.floors" :key="floorItem.floor" class="flex flex-col" :class="floorIndex > 0 ? 'border-t border-slate-100' : ''">
                    <view class="bg-slate-50-50 px-4 py-2 flex items-center justify-between border-b border-slate-100">
                      <text class="font-medium text-slate-400 text-xs">F {{ floorItem.floor }}</text>
                    </view>

                    <view class="p-4 grid grid-cols-3 gap-2 bg-slate-50-50">
                      <view
                        v-for="room in floorItem.rooms"
                        :key="room.id"
                        class="relative rounded-xl p-2 border shadow-roomcard transition-all flex flex-col justify-between room-card-compact"
                        :class="[roomVisuals(room.status).bg, roomVisuals(room.status).border, 'min-h-roomcard-edit']"
                      >
                        <view class="flex justify-between items-start mb-1">
                          <text class="font-bold text-xs font-mono" :class="roomVisuals(room.status).text">{{ room.roomNo }}</text>
                          <view class="delete-corner-button" @click.stop="removeRoom(block.id, floorItem.floor, room.id)"><text>x</text></view>
                        </view>
                        <view class="text-2xs font-medium text-slate-400 mt-2 truncate">{{ room.tenant || '租客未录入' }}</view>
                      </view>

                      <view class="room-create-tile" @click.stop="openAddModal('room', { blockId: block.id, floor: floorItem.floor })">
                        <view class="room-create-plus">+</view>
                        <text class="room-create-label">新增房间</text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>

              <view class="block-create-card" @click="openAddModal('block')">
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

      <view v-if="!addModal.open && !quickBuildModal.open" class="fixed right-5 bottom-24 z-30 stack-3 items-end">
        <button class="px-4 py-3 rounded-full text-sm font-semibold tap-scale shadow-roomcard flex items-center gap-2" :class="editMode ? 'btn-amber' : 'btn-slate'" @click="toggleEditMode">
          <text class="text-base leading-none">{{ editMode ? uiText.finishIcon : uiText.manageIcon }}</text>
          <text>{{ editMode ? uiText.finishManage : uiText.structureManage }}</text>
        </button>
      </view>

      <view v-if="addModal.open" class="fixed inset-0 z-50 bg-slate-900-50 flex items-center justify-center px-5" @click="closeAddModal">
        <view class="w-full max-w-md bg-white rounded-3xl p-5 stack-4 shadow-top-soft modal-sheet modal-sheet-center surface-card" @click.stop>
          <view class="flex items-start justify-between gap-3">
            <view class="min-w-0 flex items-start gap-3">
              <view class="w-11 h-11 rounded-2xl bg-blue-50-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <text class="text-base font-semibold">+</text>
              </view>
              <view class="min-w-0">
                <view class="text-base font-bold text-slate-800 leading-tight">{{ addModal.title }}</view>
                <view class="text-xs text-slate-400 mt-1 leading-5">{{ addModal.hint }}</view>
              </view>
            </view>
            <button class="drawer-icon-button tap-scale" @click="closeAddModal">
              <view class="icon-close"><view class="icon-close-line"></view><view class="icon-close-line icon-close-line-second"></view></view>
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

          <button class="w-full py-4 rounded-xl btn-blue font-semibold" @click="handleAddSubmit">{{ uiText.confirmAdd }}</button>
        </view>
      </view>

      <view v-if="quickBuildModal.open" class="fixed inset-0 z-50 bg-slate-900-50 flex items-center justify-center px-5" @click="closeQuickBuildModal">
        <view class="w-full max-w-md bg-white rounded-3xl p-5 stack-4 shadow-top-soft surface-card" @click.stop>
          <view class="flex items-start justify-between gap-3">
            <view>
              <view class="text-base font-bold text-slate-800">快速构建楼栋</view>
              <view class="text-xs text-slate-400 mt-1">输入楼栋名称、楼层数和每层房间数，一键生成后可继续微调。</view>
            </view>
            <button class="drawer-icon-button tap-scale" @click="closeQuickBuildModal">
              <view class="icon-close"><view class="icon-close-line"></view><view class="icon-close-line icon-close-line-second"></view></view>
            </button>
          </view>

          <view class="grid grid-cols-2 gap-3">
            <input v-model="quickBuildModal.blockName" type="text" class="quick-build-input col-span-2" placeholder="楼栋名称，例如：3号楼" />
            <input v-model="quickBuildModal.floorCount" type="number" class="quick-build-input" placeholder="楼层数" />
            <input v-model="quickBuildModal.roomsPerFloor" type="number" class="quick-build-input" placeholder="每层房间数" />
            <input v-model="quickBuildModal.topFloor" type="number" class="quick-build-input" placeholder="顶层楼层号" />
            <input v-model="quickBuildModal.roomStart" type="number" class="quick-build-input" placeholder="每层起始房号" />
          </view>

          <button class="w-full py-4 rounded-xl btn-blue font-semibold" @click="submitQuickBuild">一键快速构建</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { UI, getMiniStatusColor } from '../../ui/ui'
import { properties, cloneProperties, setProperties } from '../../data/rentStore'
import { safeNavigateTo } from '../../utils/navigation'
import { getPageHeaderTopPadding } from '../../utils/layout'
import {
  applyQuickBuild,
  applyWorkbenchStructureChange,
  buildWorkbenchStats,
  countRooms,
  createQuickBuildState,
  createWorkbenchModalState,
  getRoomStatusDot,
  getRoomVisuals,
  isRoomHighlighted,
  openWorkbenchModal,
  removeWorkbenchBlock,
  removeWorkbenchProperty,
  removeWorkbenchRoom,
} from './useWorkbenchStructure'

const activePropertyId = ref(properties.value[0]?.id || '')
const filterStatus = ref('all')
const editMode = ref(false)
const headerTopPadding = ref(44)
const inputValue = ref('')
const addModal = ref(createWorkbenchModalState())
const quickBuildModal = ref(createQuickBuildState())

const uiText = {
  finishManage: '完成管理',
  structureManage: '结构管理',
  confirmAdd: '确认添加',
  finishIcon: '✓',
  manageIcon: '⚙',
}

const filterOptions = [
  { value: 'all', label: '全部', activeClass: 'btn-slate', baseClass: 'chip-soft text-slate-600', dotClass: '' },
  { value: 'overdue', label: '欠费', activeClass: 'bg-rose-500 text-white shadow-sm', baseClass: 'bg-rose-50 text-rose-600', dotClass: 'bg-rose-500' },
  { value: 'due_soon', label: '待收', activeClass: 'bg-amber-500 text-white shadow-sm', baseClass: 'bg-amber-50 text-amber-600', dotClass: 'bg-amber-500' },
  { value: 'rented', label: '已租', activeClass: 'bg-emerald-500 text-white shadow-sm', baseClass: 'bg-emerald-50 text-emerald-600', dotClass: 'bg-emerald-500' },
  { value: 'empty', label: '空置', activeClass: 'bg-slate-500 text-white', baseClass: 'bg-slate-100 text-slate-500', dotClass: 'bg-slate-400' },
]

onLoad(() => {
  headerTopPadding.value = getPageHeaderTopPadding(44)
})

watch(properties, (next) => {
  if (!next.some((item) => item.id === activePropertyId.value)) {
    activePropertyId.value = next[0]?.id || ''
  }
}, { deep: true })

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

function openQuickBuildModal() {
  quickBuildModal.value = { ...createQuickBuildState(), open: true }
}

function closeQuickBuildModal() {
  quickBuildModal.value = createQuickBuildState()
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

function submitQuickBuild() {
  const nextProperties = cloneProperties()
  const result = applyQuickBuild(nextProperties, activePropertyId.value, quickBuildModal.value)
  if (result.error) {
    uni.showToast({ title: result.error, icon: 'none' })
    return
  }
  setProperties(nextProperties)
  closeQuickBuildModal()
  uni.showToast({ title: '已快速构建楼栋', icon: 'success' })
}

function removeRoom(blockId, floor, roomId) {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，仅移除房间结构，不影响历史数据。继续吗？',
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

function removeBlock(blockId) {
  uni.showModal({
    title: '确认删除楼栋',
    content: '删除后该楼栋下的楼层和房间结构会一起移除。继续吗？',
    confirmText: '删除',
    cancelText: '取消',
    success: (res) => {
      if (!res.confirm) return
      const nextProperties = cloneProperties()
      const removed = removeWorkbenchBlock(nextProperties, activePropertyId.value, blockId)
      if (!removed) return
      setProperties(nextProperties)
      uni.showToast({ title: '楼栋已删除', icon: 'none' })
    },
  })
}

function removeCurrentProperty() {
  if (properties.value.length <= 1) {
    uni.showToast({ title: '至少保留一个院落', icon: 'none' })
    return
  }
  uni.showModal({
    title: '确认删除院落',
    content: '删除后该院落下的全部楼栋和房间结构会一起移除。继续吗？',
    confirmText: '删除',
    cancelText: '取消',
    success: (res) => {
      if (!res.confirm) return
      const nextProperties = cloneProperties()
      const result = removeWorkbenchProperty(nextProperties, activePropertyId.value)
      if (!result.removed) return
      setProperties(nextProperties)
      activePropertyId.value = result.nextPropertyId
      uni.showToast({ title: '院落已删除', icon: 'none' })
    },
  })
}
</script>

<style>
.property-chip {
  max-width: 220rpx;
  min-height: 68rpx;
  padding: 0 24rpx;
  border-radius: 24rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
}

.property-chip-active {
  background: #0f172a;
  color: #ffffff;
}

.property-chip-default {
  background: rgba(241, 245, 249, 0.95);
  color: #64748b;
}

.property-chip-soft {
  background: #eff6ff;
  color: #2563eb;
}

.property-chip-danger {
  background: #fff1f2;
  color: #e11d48;
}

.quick-build-input {
  width: 100%;
  min-height: 84rpx;
  padding: 0 24rpx;
  border-radius: 24rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  background: #f8fafc;
  font-size: 28rpx;
  color: #0f172a;
  box-sizing: border-box;
}
</style>
