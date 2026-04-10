<template>
  <view class="min-h-screen bg-slate-50 text-slate-800">
    <view class="mx-auto max-w-md min-h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-hidden">
      <view
        class="bg-white-80 border-b px-5 pb-3 border-slate-200-60 relative shrink-0"
        :style="{ paddingTop: headerTopPadding + 'px' }"
      >
        <view class="flex items-center justify-between gap-3">
          <view class="flex items-center gap-3 min-w-0">
            <button class="nav-icon-button tap-scale" @click="goBack"><view class="icon-back"><view class="icon-back-line icon-back-line-top"></view><view class="icon-back-line icon-back-line-bottom"></view></view></button>
            <view class="min-w-0">
              <view class="font-black text-slate-900 text-base truncate">{{ block?.name || '楼栋' }}</view>
              <view class="text-xs text-slate-400 font-medium mt-0_5 truncate">
                {{ property?.name || '' }}
                <text v-if="property" class="mx-1 text-slate-200">|</text>
                共 {{ stats.totalRooms }} 间
              </view>
            </view>
          </view>

          <button class="px-3 py-1_5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 tap-scale" @click="drawerOpen = true">
            楼栋账务
          </button>
        </view>

        <scroll-view scroll-x class="mt-4" show-scrollbar="false">
          <view class="flex gap-2 pb-1">
            <button
              class="whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              :class="filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'"
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
              待收 {{ stats.dueSoonRooms }}
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
      </view>

      <scroll-view scroll-y class="flex-1" :scroll-with-animation="true">
        <view v-if="!block" class="p-5">
          <view class="p-5 rounded-2xl bg-white border border-slate-200-60 shadow-soft">
            <view class="text-sm text-slate-600 font-medium leading-relaxed">楼栋不存在或参数缺失。</view>
          </view>
        </view>

        <view v-else class="p-5 stack-5">
          <view v-for="floorItem in block.floors" :key="floorItem.floor" class="overflow-hidden" :class="UI.card">
            <view class="bg-slate-50-50 px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <view class="font-black text-slate-700 text-sm">F {{ floorItem.floor }}</view>
              <view class="text-2xs text-slate-400 font-bold">共 {{ floorItem.rooms.length }} 间</view>
            </view>

            <view class="p-4 grid grid-cols-3 gap-3 bg-slate-50-50">
              <view
                v-for="room in floorItem.rooms"
                :key="room.id"
                class="relative rounded-xl p-3 border shadow-roomcard transition-all flex flex-col justify-between min-h-roomcard tap-scale"
                :class="[
                  getRoomVisuals(room.status).bg,
                  getRoomVisuals(room.status).border,
                  !isRoomHighlighted(room.status) ? 'opacity-25 grayscale' : 'opacity-100',
                ]"
                @click="goRoom(room.id)"
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
                      {{ room.tenant || '租客未录入' }}
                    </view>
                    <view v-if="room.status === 'overdue'" class="text-2xs text-rose-600 font-bold mt-1 inline-block">欠费待收</view>
                    <view v-else class="text-2xs text-slate-500 font-mono mt-1 opacity-70">￥{{ room.rent }}/期</view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <BottomDrawer :open="drawerOpen" title="楼栋账务" subtitle="自我记账：待收与房态概览" @close="drawerOpen = false">
        <view class="stack-3">
          <view class="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <view class="text-xs text-slate-200 font-bold">待收概览</view>
            <view class="text-2xl font-black font-mono mt-2">{{ stats.overdueRooms + stats.dueSoonRooms }}</view>
            <view class="text-xs text-slate-200 font-medium mt-2">欠费 {{ stats.overdueRooms }} 间，待收 {{ stats.dueSoonRooms }} 间</view>
            <view class="mt-4 h-2 rounded-full bg-white-20 overflow-hidden">
              <view
                class="h-2 bg-emerald-400 rounded-full"
                :style="{ width: stats.totalRooms ? Math.round(((stats.totalRooms - stats.emptyRooms) / stats.totalRooms) * 100) + '%' : '0%' }"
              ></view>
            </view>
            <view class="flex items-center justify-between text-2xs text-slate-200 font-mono mt-2">
              <view>已入住 {{ stats.totalRooms - stats.emptyRooms }}</view>
              <view>总房间 {{ stats.totalRooms }}</view>
            </view>
          </view>

          <view class="p-5 rounded-2xl bg-white border border-slate-200-60 shadow-soft">
            <view class="font-black text-slate-800">说明</view>
            <view class="text-sm text-slate-600 font-medium leading-relaxed mt-2">
              本应用主要用于自我记账管理，不生成催缴文案。房租与水电的收款记账在房间详情页内完成。
            </view>
          </view>
        </view>

        <template #footer>
          <button class="w-full py-4 rounded-xl bg-blue-600 text-white font-bold tap-scale" @click="goBills">去账务看全局收支</button>
          <button class="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold tap-scale mt-2" @click="goStructure">
            去工作台做结构管理
          </button>
        </template>
      </BottomDrawer>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BottomDrawer from '../../components/BottomDrawer.vue'
import { UI } from '../../ui/ui'
import { findBlock, findProperty } from '../../data/rentStore'
import { safeNavigateBack, safeNavigateTo, safeSwitchTab } from '../../utils/navigation'

const headerTopPadding = ref(44)
const propertyId = ref('')
const blockId = ref('')
const filterStatus = ref('all')
const drawerOpen = ref(false)

const property = computed(() => (propertyId.value ? findProperty(propertyId.value) : null))
const block = computed(() => (propertyId.value && blockId.value ? findBlock(propertyId.value, blockId.value) : null))

onLoad((query) => {
  try {
    const sys = uni.getSystemInfoSync()
    headerTopPadding.value = Math.max(44, (sys.statusBarHeight || 20) + 12)
  } catch {
    headerTopPadding.value = 44
  }

  propertyId.value = String(query?.propertyId || '')
  blockId.value = String(query?.blockId || '')
})

const stats = computed(() => {
  const rooms = (block.value?.floors || []).flatMap((f) => f.rooms)
  return {
    totalRooms: rooms.length,
    emptyRooms: rooms.filter((room) => room.status === 'empty').length,
    overdueRooms: rooms.filter((room) => room.status === 'overdue').length,
    dueSoonRooms: rooms.filter((room) => room.status === 'due_soon').length,
  }
})

function goBack() {
  safeNavigateBack({ fallbackUrl: '/pages/workbench/index', fallbackType: 'switchTab' })
}

function setFilter(status) {
  filterStatus.value = status
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

function goRoom(roomId) {
  const hit = (block.value?.floors || []).flatMap((f) => f.rooms).find((r) => r.id === roomId)
  const target = hit?.status === 'empty' ? 'checkin' : 'detail'
  safeNavigateTo(`/pages/room/${target}?propertyId=${propertyId.value}&blockId=${blockId.value}&roomId=${roomId}`)
}

function goStructure() {
  drawerOpen.value = false
  safeSwitchTab('/pages/workbench/index')
  setTimeout(() => {
    uni.showToast({ title: '请在工作台进入结构管理', icon: 'none' })
  }, 80)
}

function goBills() {
  drawerOpen.value = false
  safeSwitchTab('/pages/bills/index')
}
</script>

