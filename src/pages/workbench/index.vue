<template>
  <view class="workbench-page h-screen bg-slate-50 text-slate-800">
    <view class="workbench-shell mx-auto max-w-md h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-hidden">
      <view class="bg-white-80 px-5 pb-3 relative shrink-0 z-20 shadow-soft sticky-header" :style="{ paddingTop: headerTopPadding + 'px' }">
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
            <view v-for="property in properties" :key="property.id" class="property-chip-wrap">
              <button
                class="property-chip tap-scale"
                :class="[property.id === activePropertyId ? 'property-chip-active' : 'property-chip-default', editMode && property.id === activePropertyId ? 'property-chip-editable' : '']"
                @click="switchProperty(property.id)"
              >
                <text class="truncate">{{ property.name }}</text>
              </button>
              <button v-if="editMode && properties.length > 1 && property.id === activePropertyId" class="property-chip-delete property-chip-delete-active tap-scale" @click.stop="removeProperty(property.id)">×</button>
            </view>
            <button v-if="editMode && properties.length < 3" class="structure-icon-action structure-icon-add tap-scale" @click="openAddModal('property')">+</button>
          </view>
        </scroll-view>
      </view>

      <scroll-view scroll-y class="page-scroll workbench-content-scroll" :scroll-with-animation="true">
        <view class="p-5 stack-5" style="padding-bottom: 168rpx;">
          <view v-if="workbenchRefreshing" class="loading-pill loading-pill-blue">
            <view class="loading-pill-dots">
              <view class="loading-pill-dot"></view>
              <view class="loading-pill-dot"></view>
              <view class="loading-pill-dot"></view>
            </view>
            <text class="loading-pill-text">正在同步最新房源数据…</text>
          </view>
          <view v-if="syncSummary.count > 0" class="loading-pill loading-pill-slate">
            <view class="loading-pill-dots">
              <view class="loading-pill-dot"></view>
              <view class="loading-pill-dot"></view>
              <view class="loading-pill-dot"></view>
            </view>
            <text class="loading-pill-text">待同步 {{ syncSummary.count }} 条本地变更</text>
          </view>
          <view v-if="syncSummary.failedCount > 0 || syncSummary.lastError" class="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
            <view class="text-2xs font-semibold text-amber-700">
              {{ syncSummary.failedCount > 0 ? `同步暂未完成，正在重试 ${syncSummary.failedCount} 条` : '同步正在处理中' }}
              <text v-if="syncPendingTypeText"> · {{ syncPendingTypeText }}</text>
            </view>
            <view class="text-3xs text-amber-600 mt-1">请保持网络连接，完成后会自动更新。</view>
          </view>
          <view v-if="activeProperty" class="relative mt-2">
            <view v-if="!editMode" class="stack-4 animate-in fade-in duration-300">
              <view
                v-for="block in activeProperty.blocks"
                :key="block.id"
                class="p-4 cursor-pointer transition-all tap-scale surface-card"
                :class="UI.card"
                @click="goBlock(block.id)"
              >
                <view class="flex justify-between items-center mb-4 pb-3">
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
                    <view class="w-8 text-right text-2xs font-medium text-slate-400 truncate">{{ floorItem.name || getFloorDisplayName(floorItem.floor) }}</view>
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
                <view class="bg-slate-100-50 px-4 py-3 flex items-center justify-between">
                  <view class="font-bold text-slate-700 text-sm">{{ block.name }}</view>
                  <button class="structure-delete-text tap-scale" @click.stop="removeBlock(block.id)">×</button>
                </view>

                <view class="structure-add-floor tap-scale" @click.stop="openAddModal('floor', { blockId: block.id })">
                  <text>+ 新增楼层</text>
                </view>

                <view v-if="block.floors.length === 0" class="py-12 text-center text-slate-400 font-medium">暂无楼层</view>

                <view v-else>
                  <view v-for="(floorItem, floorIndex) in block.floors" :key="floorItem.floor" class="floor-structure-row flex flex-col" :class="floorIndex > 0 ? 'floor-structure-row-separated' : ''">
                    <view class="floor-structure-header bg-slate-50-50 px-4 flex items-center justify-between">
                      <text class="font-medium text-slate-400 text-2xs">{{ floorItem.name || getFloorDisplayName(floorItem.floor) }}</text>
                      <button class="structure-delete-text tap-scale" @click.stop="removeFloor(block.id, floorItem.floor)">×</button>
                    </view>

                    <view class="floor-room-grid grid grid-cols-3 gap-2 bg-slate-50-50">
                      <view
                        v-for="room in floorItem.rooms"
                        :key="room.id"
                        class="relative rounded-xl p-2 border shadow-roomcard transition-all flex flex-col justify-between room-card-compact"
                        :class="[roomVisuals(room.status).bg, roomVisuals(room.status).border, 'min-h-roomcard-edit']"
                      >
                        <view class="flex justify-between items-start mb-1">
                          <text class="font-bold text-xs font-mono" :class="roomVisuals(room.status).text">{{ room.roomNo }}</text>
                          <button class="room-delete-button tap-scale" @click.stop="removeRoom(block.id, floorItem.floor, room.id)">×</button>
                        </view>
                        <view class="text-2xs font-medium text-slate-400 mt-2 truncate">{{ room.tenant || '空置待租' }}</view>
                      </view>

                      <view class="room-create-tile" @click.stop="openAddModal('room', { blockId: block.id, floor: floorItem.floor })">
                        <view class="room-create-plus">+</view>
                        <text class="room-create-label">新增房间</text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>

              <view class="block-create-card" @click="openQuickBuildModal">
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

          <view v-if="addModal.type === 'floor'" class="grid grid-cols-2 gap-3">
            <view class="structure-field">
              <view class="structure-field-label">楼层号</view>
              <input v-model="inputValue" type="number" placeholder="例如：3" class="structure-modal-input" />
            </view>
            <view class="structure-field">
              <view class="structure-field-label">初始房间数量</view>
              <input v-model="addModal.roomCount" type="number" placeholder="例如：6" class="structure-modal-input" />
            </view>
          </view>
          <view v-else class="structure-field">
            <view class="structure-field-label">{{ addModalFieldLabel }}</view>
            <input
              v-model="inputValue"
              :type="addModal.inputType"
              :placeholder="addModal.placeholder"
              class="w-full px-4 py-4 input-soft rounded-xl font-medium text-slate-800 modal-input"
              confirm-type="done"
              @confirm="handleAddSubmit"
            />
          </view>

          <button class="structure-modal-primary btn-blue tap-scale" @click="handleAddSubmit">{{ uiText.confirmAdd }}</button>
        </view>
      </view>

      <view v-if="quickBuildModal.open" class="fixed inset-0 z-50 bg-slate-900-50 flex items-center justify-center px-5" @click="closeQuickBuildModal">
        <view class="w-full max-w-md bg-white rounded-3xl p-5 stack-4 shadow-top-soft surface-card" @click.stop>
          <view class="flex items-start justify-between gap-3">
            <view>
              <view class="text-base font-bold text-slate-800">快速构建楼栋</view>
              <view class="text-xs text-slate-400 mt-1">填写楼层与每层房间数，生成后仍可继续增删楼层和房间。</view>
            </view>
            <button class="drawer-icon-button tap-scale" @click="closeQuickBuildModal">
              <view class="icon-close"><view class="icon-close-line"></view><view class="icon-close-line icon-close-line-second"></view></view>
            </button>
          </view>

          <view class="grid grid-cols-2 gap-3">
            <view class="structure-field col-span-2">
              <view class="structure-field-label">楼栋名称</view>
              <input v-model="quickBuildModal.blockName" type="text" class="quick-build-input" placeholder="例如：3号楼" />
            </view>
            <view class="structure-field">
              <view class="structure-field-label">楼层数量</view>
              <input v-model="quickBuildModal.floorCount" type="number" class="quick-build-input" placeholder="例如：6" />
            </view>
            <view class="structure-field">
              <view class="structure-field-label">地下室</view>
              <view class="quick-build-basement-toggle">
                <button class="quick-build-basement-option tap-scale" :class="!quickBuildModal.hasBasement ? 'quick-build-basement-option-active' : ''" @click="setQuickBuildBasement(false)">无地下室</button>
                <button class="quick-build-basement-option tap-scale" :class="quickBuildModal.hasBasement ? 'quick-build-basement-option-active' : ''" @click="setQuickBuildBasement(true)">有 B1</button>
              </view>
            </view>
          </view>

          <button class="quick-build-generate-button tap-scale" @click="prepareQuickBuildFloors">生成逐层房间数</button>

          <view v-if="quickBuildModal.floorRowsReady" class="quick-build-floor-title">逐层设置房间数</view>
          <scroll-view v-if="quickBuildModal.floorRowsReady" scroll-y class="quick-build-floor-list">
            <view v-for="row in quickBuildModal.floorRooms" :key="row.floor" class="quick-build-floor-row">
              <text class="quick-build-floor-name">{{ getFloorDisplayName(row.floor) }}</text>
              <view class="quick-build-floor-field">
                <text class="quick-build-floor-field-label">房间数量</text>
                <input v-model="row.rooms" type="number" class="quick-build-floor-input" placeholder="例如：6" />
              </view>
            </view>
          </scroll-view>

          <button class="structure-modal-primary btn-blue tap-scale" @click="submitQuickBuild">确认构建楼栋</button>
        </view>
      </view>
      <view v-if="!isLoggedIn" class="absolute inset-0 z-50 bg-slate-50 flex items-center justify-center px-8">
        <view class="w-full rounded-3xl bg-white p-6 text-center shadow-soft">
          <view class="text-lg font-black text-slate-900">请先登录</view>
          <view class="mt-2 text-sm text-slate-400">登录后才可查看和管理房源数据。</view>
          <button class="mt-5 w-full py-3 rounded-xl btn-blue text-sm font-semibold" @click="uni.switchTab({ url: '/pages/profile/index' })">前往我的登录</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { UI, getMiniStatusColor } from '../../ui/ui'
import { getDefaultRoomNo, getFloorDisplayName } from '../../domain/rent-models.js'
import { properties, cloneProperties, setProperties } from '../../data/rentStore'
import { canManageTenantData, isLoggedIn } from '../../data/authStore'
import { fetchFullPropertiesSnapshot, getCachedPropertiesTree, migrateLocalPropertiesSnapshot } from '../../api/properties'
import { prefetchRoomDetails } from '../../api/rooms'
import { safeNavigateTo } from '../../utils/navigation'
import { getPageHeaderTopPadding } from '../../utils/layout'
import { canUseCloudBackup, hasCloudApiBaseUrl } from '../../config/cloud'
import { clearPendingSyncTasks, enqueueSyncTask, getPendingSyncSummary } from '../../data/syncQueue.js'
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
  removeWorkbenchFloor,
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
const addModalFieldLabel = computed(() => ({
  property: '院落名称',
  block: '楼栋名称',
  room: '房间名称',
})[addModal.value.type] || '填写内容')
const workbenchRefreshing = ref(false)
const cloudBootstrapPrompted = ref(false)
const syncSummary = ref(getPendingSyncSummary())
const syncPendingTypeText = computed(() => {
  const counts = syncSummary.value?.pendingTypeCounts || {}
  const firstKey = Object.keys(counts).find((key) => Number(counts[key] || 0) > 0)
  if (!firstKey) return ''
  return `${syncTaskTypeLabel(firstKey)} ${Number(counts[firstKey] || 0)}`
})

const uiText = {
  finishManage: '完成管理',
  structureManage: '房屋管理',
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
  if (hasCloudApiBaseUrl()) {
    const cachedTree = getCachedPropertiesTree()
    if (Array.isArray(cachedTree) && cachedTree.length) {
      setProperties(cachedTree)
    }
  }
  syncSummary.value = getPendingSyncSummary()
  warmVisibleRoomCache()
  void syncCloudProperties()
})

onShow(() => {
  syncSummary.value = getPendingSyncSummary()
  void syncCloudProperties()
})

async function syncCloudProperties() {
  if (!hasCloudApiBaseUrl()) return
  workbenchRefreshing.value = true
  try {
    const localSnapshot = cloneProperties()
    let next = await fetchFullPropertiesSnapshot()
    if (!next.length && localSnapshot.length && !cloudBootstrapPrompted.value) {
      cloudBootstrapPrompted.value = true
      const roomCount = localSnapshot.reduce(
        (total, property) => total + (property.blocks || []).reduce(
          (blockTotal, block) => blockTotal + (block.floors || []).reduce(
            (floorTotal, floor) => floorTotal + (floor.rooms || []).length,
            0
          ),
          0
        ),
        0
      )
      const decision = await uni.showModal({
        title: '云端尚未初始化',
        content: `本机有 ${roomCount} 个房间数据。云端将成为唯一数据源，是否将本机数据初始化到云端？`,
        confirmText: '初始化云端',
        cancelText: '暂不上传',
      })
      if (decision.confirm) {
        next = await migrateLocalPropertiesSnapshot(localSnapshot)
        clearPendingSyncTasks()
        uni.showToast({ title: '本机历史数据已迁移至云端', icon: 'none' })
      }
    }
    if (Array.isArray(next) && next.length) {
      setProperties(next)
      warmVisibleRoomCache()
    }
  } catch (error) {
    // A second device may race with the first one. Read the protected cloud
    // snapshot again instead of ever overwriting the established source.
    if (error?.code === 'CLOUD_DATA_EXISTS') {
      const next = await fetchFullPropertiesSnapshot()
      if (next.length) setProperties(next)
    }
  } finally {
    workbenchRefreshing.value = false
  }
}

function warmVisibleRoomCache() {
  if (editMode.value) return
  prefetchRoomDetails(visibleRoomIdsForPrefetch.value, 8)
}

watch(properties, (next) => {
  if (!next.some((item) => item.id === activePropertyId.value)) {
    activePropertyId.value = next[0]?.id || ''
  }
}, { deep: true })

const activeProperty = computed(() => properties.value.find((item) => item.id === activePropertyId.value))
const stats = computed(() => buildWorkbenchStats(activeProperty.value))
const visibleRoomIdsForPrefetch = computed(() => {
  const blocks = activeProperty.value?.blocks || []
  return blocks
    .flatMap((block) => (block.floors || []).flatMap((floorItem) => floorItem.rooms || []))
    .filter((room) => isHighlighted(room.status))
    .map((room) => room.id)
    .slice(0, 8)
})

function switchProperty(propertyId) {
  activePropertyId.value = propertyId
  warmVisibleRoomCache()
}

function setFilter(status) {
  filterStatus.value = status
  warmVisibleRoomCache()
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
  if (!isLoggedIn.value) {
    uni.showToast({ title: '请先登录后再操作', icon: 'none' })
    uni.switchTab({ url: '/pages/profile/index' })
    return
  }
  if (editMode.value) return
  safeNavigateTo(`/pages/block/detail?propertyId=${activePropertyId.value}&blockId=${blockId}`)
}

function openAddModal(type, payload = {}) {
  const nextModal = openWorkbenchModal(type, payload)
  if (!nextModal) return
  addModal.value = nextModal
  if (type === 'floor') {
    const block = activeProperty.value?.blocks?.find((item) => item.id === payload.blockId)
    inputValue.value = String(Math.max(0, ...(block?.floors || []).map((item) => Number(item.floor) || 0)) + 1)
    addModal.value.roomCount = '1'
  } else if (type === 'room') {
    const floorItem = activeProperty.value?.blocks?.find((item) => item.id === payload.blockId)?.floors?.find((item) => item.floor === payload.floor)
    const existingRoomNos = new Set((floorItem?.rooms || []).map((item) => String(item.roomNo || '')))
    let roomSuffix = 1
    while (existingRoomNos.has(getDefaultRoomNo(payload.floor, roomSuffix))) roomSuffix += 1
    inputValue.value = getDefaultRoomNo(payload.floor, roomSuffix)
  } else {
    inputValue.value = ''
  }
}

function closeAddModal() {
  addModal.value = createWorkbenchModalState()
  inputValue.value = ''
}

function openQuickBuildModal() {
  quickBuildModal.value = { ...createQuickBuildState(), open: true }
}

function syncQuickBuildFloorRows() {
  const floorCount = Math.max(1, Number(quickBuildModal.value.floorCount) || 1)
  const existing = new Map((quickBuildModal.value.floorRooms || []).map((item) => [Number(item.floor), String(item.rooms || '1')]))
  const floors = quickBuildModal.value.hasBasement
    ? Array.from({ length: floorCount }, (_, index) => floorCount - index - 1)
    : Array.from({ length: floorCount }, (_, index) => floorCount - index)
  quickBuildModal.value.floorRooms = floors.map((floor) => {
    return { floor, rooms: existing.get(floor) || '1' }
  })
}

watch(() => [quickBuildModal.value.floorCount, quickBuildModal.value.hasBasement], () => {
  if (quickBuildModal.value.open && quickBuildModal.value.floorRowsReady) syncQuickBuildFloorRows()
})

function setQuickBuildBasement(hasBasement) {
  quickBuildModal.value.hasBasement = hasBasement
}

function prepareQuickBuildFloors() {
  const floorCount = Number(quickBuildModal.value.floorCount || 0)
  if (!Number.isInteger(floorCount) || floorCount <= 0) {
    uni.showToast({ title: '请填写有效楼层数', icon: 'none' })
    return
  }
  quickBuildModal.value.floorRowsReady = true
  syncQuickBuildFloorRows()
}

watch(() => activeProperty.value?.id, () => {
  warmVisibleRoomCache()
})

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
  if (canUseCloudBackup()) {
    enqueueSyncTask({
      type: 'properties.treeSync',
      payload: { tree: nextProperties },
    })
    syncSummary.value = getPendingSyncSummary()
  }
  if (result.nextPropertyId) {
    activePropertyId.value = result.nextPropertyId
  }
  closeAddModal()
  uni.showToast({ title: '添加成功', icon: 'success' })
}

function submitQuickBuild() {
  if (!quickBuildModal.value.floorRowsReady) {
    prepareQuickBuildFloors()
    return
  }
  const nextProperties = cloneProperties()
  const result = applyQuickBuild(nextProperties, activePropertyId.value, quickBuildModal.value)
  if (result.error) {
    uni.showToast({ title: result.error, icon: 'none' })
    return
  }
  setProperties(nextProperties)
  if (canUseCloudBackup()) {
    enqueueSyncTask({
      type: 'properties.treeSync',
      payload: { tree: nextProperties },
    })
    syncSummary.value = getPendingSyncSummary()
  }
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
      if (canUseCloudBackup()) {
        enqueueSyncTask({
          type: 'properties.treeSync',
          payload: { tree: nextProperties },
        })
        syncSummary.value = getPendingSyncSummary()
      }
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
      if (canUseCloudBackup()) {
        enqueueSyncTask({
          type: 'properties.treeSync',
          payload: { tree: nextProperties },
        })
        syncSummary.value = getPendingSyncSummary()
      }
      uni.showToast({ title: '楼栋已删除', icon: 'none' })
    },
  })
}

function removeProperty(propertyId) {
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
      const result = removeWorkbenchProperty(nextProperties, propertyId)
      if (!result.removed) return
      setProperties(nextProperties)
      if (activePropertyId.value === propertyId) activePropertyId.value = result.nextPropertyId
      if (canUseCloudBackup()) {
        enqueueSyncTask({
          type: 'properties.treeSync',
          payload: { tree: nextProperties },
        })
        syncSummary.value = getPendingSyncSummary()
      }
      uni.showToast({ title: '院落已删除', icon: 'none' })
    },
  })
}

function removeFloor(blockId, floor) {
  uni.showModal({
    title: '确认删除楼层',
    content: '删除后该楼层下的所有房间会一起移除。继续吗？',
    confirmText: '删除',
    cancelText: '取消',
    success: (res) => {
      if (!res.confirm) return
      const nextProperties = cloneProperties()
      const removed = removeWorkbenchFloor(nextProperties, activePropertyId.value, blockId, floor)
      if (!removed) return
      setProperties(nextProperties)
      if (canUseCloudBackup()) {
        enqueueSyncTask({ type: 'properties.treeSync', payload: { tree: nextProperties } })
        syncSummary.value = getPendingSyncSummary()
      }
      uni.showToast({ title: '楼层已删除', icon: 'none' })
    },
  })
}

function syncTaskTypeLabel(type) {
  return {
    'properties.treeSync': '结构',
    'room.checkin': '入住',
    'room.rentCollection': '房租',
    'room.utilityCollection': '附加费',
    'room.meterReading': '抄表',
    'room.checkout': '退租',
    'attachment.upload': '附件',
  }[String(type || '')] || '同步'
}

function formatSyncError(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw.includes('WEEKLY_SYNC_WAITING_FOR_WIFI')) return '当前网络不适合备份，已延后'
  if (raw.includes('timeout')) return '网络超时，等待稍后重试'
  if (raw.includes('request:fail')) return '网络请求失败，等待稍后重试'
  if (raw.includes('401')) return '云端未授权，需要重新建立会话'
  if (raw.includes('404')) return '云端接口暂不可用，请稍后重试'
  if (raw.includes('UPLOAD_FAILED')) return '文件上传失败，等待稍后重试'
  return raw
}
</script>

<style>
.workbench-page {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.workbench-shell {
  height: 100vh;
  max-height: 100vh;
  min-height: 0;
}

.workbench-content-scroll {
  min-height: 0;
}

.property-chip {
  max-width: 220rpx;
  min-height: 68rpx;
  padding: 0 24rpx;
  border-radius: 24rpx;
  border: 0;
  outline: 0;
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

.property-chip-editable { padding-right: 48rpx; }

.property-chip-wrap { position: relative; display: inline-flex; align-items: center; }

.property-chip-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  z-index: 1;
  width: 26rpx;
  height: 26rpx;
  min-width: 26rpx;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #94a3b8;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 1;
}

.property-chip-delete-active { color: #ffffff; }

.structure-icon-action {
  width: 68rpx;
  min-width: 68rpx;
  height: 68rpx;
  padding: 0;
  border-radius: 22rpx;
  font-size: 38rpx;
  font-weight: 500;
  line-height: 1;
}

.structure-icon-add { background: #eff6ff; color: #2563eb; }
.structure-icon-delete { background: #fff1f2; color: #e11d48; }

.structure-delete-text,
.room-delete-button {
  width: 40rpx;
  height: 40rpx;
  min-width: 40rpx;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #e11d48;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 1;
}

.room-delete-button { width: 30rpx; height: 30rpx; min-width: 30rpx; font-size: 28rpx; }

.structure-add-floor {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 68rpx;
  margin: 24rpx 30rpx;
  border: 1rpx dashed #bfdbfe;
  border-radius: 18rpx;
  background: #f8fbff;
  color: #2563eb;
  font-size: 25rpx;
  font-weight: 600;
}

.floor-structure-row-separated { border-top: 1rpx dashed #e2e8f0; }
.floor-structure-header { min-height: 56rpx; }
.floor-room-grid { padding: 18rpx 30rpx 26rpx; }

.structure-modal-input {
  width: 100%;
  min-height: 76rpx;
  padding: 0 20rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  border-radius: 18rpx;
  background: #f8fafc;
  color: #0f172a;
  font-size: 26rpx;
  box-sizing: border-box;
}

.structure-field { min-width: 0; }
.structure-field-label { margin: 0 0 10rpx 4rpx; color: #64748b; font-size: 23rpx; font-weight: 600; line-height: 1.2; }

.structure-modal-primary {
  width: 100%;
  min-height: 76rpx;
  padding: 0 24rpx;
  border-radius: 18rpx;
  color: #ffffff;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 76rpx;
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

.quick-build-basement-toggle { display: flex; min-height: 84rpx; padding: 6rpx; border-radius: 24rpx; background: #f8fafc; border: 1rpx solid rgba(226, 232, 240, 0.95); box-sizing: border-box; }
.quick-build-basement-option { flex: 1; min-width: 0; padding: 0 10rpx; border: 0; border-radius: 18rpx; background: transparent; color: #64748b; font-size: 22rpx; font-weight: 500; line-height: 70rpx; }
.quick-build-basement-option-active { background: #ffffff; color: #2563eb; box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.1); font-weight: 600; }

.quick-build-floor-title { color: #475569; font-size: 24rpx; font-weight: 600; }
.quick-build-floor-list { max-height: 280rpx; border-radius: 18rpx; background: #f8fafc; }
.quick-build-floor-row { display: flex; align-items: center; gap: 16rpx; min-height: 76rpx; padding: 10rpx 18rpx; border-bottom: 1rpx solid #e2e8f0; box-sizing: border-box; }
.quick-build-floor-row:last-child { border-bottom: 0; }
.quick-build-floor-name { min-width: 72rpx; color: #475569; font-size: 24rpx; font-weight: 600; }
.quick-build-floor-field { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: flex-end; gap: 16rpx; }
.quick-build-floor-field-label { color: #94a3b8; font-size: 22rpx; line-height: 1; }
.quick-build-floor-input { width: 128rpx; height: 50rpx; padding: 0 16rpx; border: 1rpx solid #e2e8f0; border-radius: 14rpx; background: #fff; color: #0f172a; font-size: 24rpx; text-align: center; box-sizing: border-box; }
.quick-build-generate-button { width: 100%; min-height: 68rpx; padding: 0 20rpx; border: 1rpx solid #bfdbfe; border-radius: 18rpx; background: #eff6ff; color: #2563eb; font-size: 25rpx; font-weight: 600; line-height: 68rpx; }
</style>
