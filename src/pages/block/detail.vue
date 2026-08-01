<template>
  <view class="h-screen bg-slate-50 text-slate-800">
    <view class="mx-auto max-w-md h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-hidden">
      <view
        class="bg-white-80 px-5 pb-3 relative shrink-0 sticky-header z-20 shadow-soft"
        :style="{ paddingTop: headerTopPadding + 'px' }"
      >
        <view class="flex items-center justify-between gap-3">
          <view class="flex items-center gap-3 min-w-0">
            <view class="nav-icon-button tap-scale" @click="goBack">
              <view class="icon-back">
                <view class="icon-back-line icon-back-line-top"></view>
                <view class="icon-back-line icon-back-line-bottom"></view>
              </view>
            </view>
            <view class="min-w-0">
              <view class="font-black text-slate-900 text-base truncate">{{ block?.name || '楼栋详情' }}</view>
              <view class="text-xs text-slate-400 font-medium mt-0_5 truncate">
                {{ property?.name || '' }}
                <text v-if="property" class="mx-1 text-slate-200">|</text>
                共 {{ stats.totalRooms }} 间
              </view>
            </view>
          </view>
        </view>

        <scroll-view scroll-x class="mt-4" show-scrollbar="false">
          <view class="flex gap-2 pb-1">
            <view
              class="block-filter-control whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'"
              @click="setFilter('all')"
            >
              全部
            </view>
            <view
              class="block-filter-control whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'overdue' ? 'bg-rose-500 text-white shadow-md' : 'bg-rose-50 text-rose-600'"
              @click="setFilter('overdue')"
            >
              <view class="size-1_5 rounded-full" :class="filterStatus === 'overdue' ? 'bg-white' : 'bg-rose-500'"></view>
              欠费 {{ stats.overdueRooms }}
            </view>
            <view
              class="block-filter-control whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'due_soon' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-50 text-amber-600'"
              @click="setFilter('due_soon')"
            >
              <view class="size-1_5 rounded-full" :class="filterStatus === 'due_soon' ? 'bg-white' : 'bg-amber-500'"></view>
              待收 {{ stats.dueSoonRooms }}
            </view>
            <view
              class="block-filter-control whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'rented' ? 'bg-emerald-500 text-white shadow-md' : 'bg-emerald-50 text-emerald-600'"
              @click="setFilter('rented')"
            >
              <view class="size-1_5 rounded-full" :class="filterStatus === 'rented' ? 'bg-white' : 'bg-emerald-500'"></view>
              已租
            </view>
            <view
              class="block-filter-control whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'empty' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-500'"
              @click="setFilter('empty')"
            >
              <view class="size-1_5 rounded-full" :class="filterStatus === 'empty' ? 'bg-white' : 'bg-slate-400'"></view>
              空置
            </view>
          </view>
        </scroll-view>
      </view>

      <scroll-view scroll-y class="page-scroll flex-1" :scroll-with-animation="true" enable-flex>
        <view v-if="!block" class="p-5">
          <view class="p-5 rounded-2xl bg-white border border-slate-200-60 shadow-soft">
            <view class="text-sm text-slate-600 font-medium leading-relaxed">楼栋不存在或页面参数缺失。</view>
          </view>
        </view>

        <view v-else class="p-5 stack-5">
          <view
            v-for="floorItem in block.floors"
            :key="floorItem.floor"
            class="floor-section overflow-hidden"
          >
            <view class="floor-section-header px-4 py-3 flex items-center justify-between">
              <view class="font-black text-slate-700 text-sm">{{ floorItem.name || `${floorItem.floor}层` }}</view>
              <view class="text-2xs text-slate-400 font-bold">共 {{ floorItem.rooms.length }} 间</view>
            </view>

            <view class="floor-section-grid p-4 grid grid-cols-3 gap-3">
              <view
                v-for="room in floorItem.rooms"
                :key="room.id"
                class="room-tile relative rounded-xl p-3 transition-all flex flex-col justify-between min-h-roomcard tap-scale"
                :class="[
                  getRoomVisuals(room.status).bg,
                  getRoomVisuals(room.status).border,
                  !isRoomHighlighted(room.status) ? 'opacity-25 grayscale' : 'opacity-100',
                ]"
                @click="goRoom(room)"
              >
                <view class="flex justify-between items-start mb-1">
                  <text class="font-bold text-base font-mono" :class="getRoomVisuals(room.status).text">
                    {{ room.roomNo }}
                  </text>
                  <view class="w-2 h-2 rounded-full mt-1_5" :class="roomStatusDot(room.status)"></view>
                </view>

                <view>
                  <view v-if="room.status === 'empty'" class="text-2xs font-medium text-slate-400 mt-2">空置待租</view>
                  <view v-else>
                    <view class="text-xs font-medium truncate" :class="getRoomVisuals(room.status).text">
                      {{ room.tenant || '空置待租' }}
                    </view>
                    <view v-if="room.status === 'overdue'" class="text-2xs text-rose-600 font-bold mt-1 inline-block">欠费待收</view>
                    <view v-else class="text-2xs text-slate-500 font-mono mt-1 opacity-70">￥{{ room.rent || 0 }}/期</view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <RoomDetailSheet
        :open="roomSheetOpen"
        :property-id="propertyId"
        :block-id="blockId"
        :room-id="selectedRoomId"
        @close="closeRoomSheet"
      />
      <CheckInSheet
        :open="checkInSheetOpen"
        :property-id="propertyId"
        :block-id="blockId"
        :room-id="selectedRoomId"
        @close="closeCheckInSheet"
        @checked-in="handleCheckedIn"
        @request-detail="handleCheckInRequestDetail"
      />
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import RoomDetailSheet from '../../components/RoomDetailSheet.vue'
import CheckInSheet from '../../components/CheckInSheet.vue'
import { findBlock, findProperty, setProperties } from '../../data/rentStore'
import { getCachedPropertiesTree } from '../../api/properties'
import { prefetchRoomDetails } from '../../api/rooms'
import { safeNavigateBack } from '../../utils/navigation'
import { getPageHeaderTopPadding } from '../../utils/layout'

const headerTopPadding = ref(44)
const propertyId = ref('')
const blockId = ref('')
const filterStatus = ref('all')
const roomSheetOpen = ref(false)
const checkInSheetOpen = ref(false)
const selectedRoomId = ref('')

const property = computed(() => (propertyId.value ? findProperty(propertyId.value) : null))
const block = computed(() => (propertyId.value && blockId.value ? findBlock(propertyId.value, blockId.value) : null))

onLoad((query) => {
  headerTopPadding.value = getPageHeaderTopPadding(44)
  propertyId.value = String(query?.propertyId || '')
  blockId.value = String(query?.blockId || '')
  const cachedTree = getCachedPropertiesTree()
  if (Array.isArray(cachedTree) && cachedTree.length) {
    setProperties(cachedTree)
  }
  warmVisibleRoomCache()
})

function warmVisibleRoomCache() {
  prefetchRoomDetails(visibleRoomIdsForPrefetch.value, 8)
}

const stats = computed(() => {
  const rooms = (block.value?.floors || []).flatMap((floor) => floor.rooms)
  return {
    totalRooms: rooms.length,
    emptyRooms: rooms.filter((room) => room.status === 'empty').length,
    overdueRooms: rooms.filter((room) => room.status === 'overdue').length,
    dueSoonRooms: rooms.filter((room) => room.status === 'due_soon').length,
  }
})

const visibleRoomIdsForPrefetch = computed(() => {
  const rooms = (block.value?.floors || []).flatMap((floorItem) => floorItem.rooms || [])
  return rooms.filter((room) => isRoomHighlighted(room.status)).map((room) => room.id).slice(0, 8)
})

function goBack() {
  safeNavigateBack({ fallbackUrl: '/pages/workbench/index', fallbackType: 'switchTab' })
}

function setFilter(status) {
  filterStatus.value = status
  warmVisibleRoomCache()
}

function isRoomHighlighted(status) {
  return filterStatus.value === 'all' || filterStatus.value === status || (filterStatus.value === 'rented' && status === 'due_soon')
}

function getRoomVisuals(status) {
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

function goRoom(room) {
  if (!room?.id) return
  selectedRoomId.value = room.id
  if (room.status === 'empty') {
    checkInSheetOpen.value = true
    return
  }
  roomSheetOpen.value = true
}

function closeRoomSheet() {
  roomSheetOpen.value = false
  selectedRoomId.value = ''
}

function closeCheckInSheet() {
  checkInSheetOpen.value = false
  selectedRoomId.value = ''
}

function handleCheckedIn() {
  checkInSheetOpen.value = false
}

function handleCheckInRequestDetail() {
  checkInSheetOpen.value = false
  roomSheetOpen.value = true
}

watch(() => block.value?.id, () => {
  warmVisibleRoomCache()
})
</script>

<style>
.floor-section {
  background: #ffffff;
  border: 1rpx solid #edf1f5;
  border-radius: 32rpx;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.045);
}

.floor-section-header {
  background: #ffffff;
}

.floor-section-grid {
  background: #f8fafc;
}

.room-tile {
  border-width: 1rpx;
  border-style: solid;
  box-shadow: 0 6rpx 14rpx rgba(15, 23, 42, 0.035);
}

.block-filter-control {
  min-height: 56rpx;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
}
</style>
