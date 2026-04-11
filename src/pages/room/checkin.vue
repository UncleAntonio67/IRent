<template>
  <view class="min-h-screen bg-slate-900-45 flex items-end justify-center" @click="closeSelf">
    <view class="w-full max-w-md drawer-page-panel flex flex-col bg-slate-50 rounded-t-3xl shadow-2xl relative overflow-hidden" @click.stop>
      <view class="bg-white-80 border-b px-5 pb-3 border-slate-200-60 shrink-0" :style="{ paddingTop: headerTopPadding + 'px' }">
        <view class="flex justify-center">
          <view class="w-12 h-1_5 rounded-full bg-slate-200 mt-1"></view>
        </view>
        <view class="flex items-center justify-between gap-3 mt-2">
          <view class="flex items-center gap-3 min-w-0">
            <button class="nav-icon-button tap-scale" @click="closeSelf">
              <view class="icon-close">
                <view class="icon-close-line"></view>
                <view class="icon-close-line icon-close-line-second"></view>
              </view>
            </button>
            <view class="min-w-0">
              <view class="font-black text-slate-900 text-base truncate">办理入住</view>
              <view class="text-xs text-slate-400 font-medium mt-0_5 truncate">{{ roomLocationText }}</view>
            </view>
          </view>
          <view v-if="room" class="text-2xs font-bold px-3 py-1 rounded-full chip-soft text-slate-600">
            {{ room.roomNo }} {{ room.status === 'empty' ? '空置' : '已租' }}
          </view>
        </view>

        <view class="mt-3">
          <view class="p-1 surface-muted rounded-2xl flex gap-1">
            <button
              class="flex-1 py-2 rounded-xl text-xs font-black tap-scale"
              :class="tab === 'current' ? 'bg-white text-slate-900 shadow-soft' : 'bg-transparent text-slate-500'"
              @click="tab = 'current'"
            >
              当前情况
            </button>
            <button
              class="flex-1 py-2 rounded-xl text-xs font-black tap-scale"
              :class="tab === 'history' ? 'bg-white text-slate-900 shadow-soft' : 'bg-transparent text-slate-500'"
              @click="tab = 'history'"
            >
              历史入住
            </button>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="drawer-scroll-area" :scroll-with-animation="true" enable-flex>
        <view v-if="!room" class="px-5 pt-3 pb-5">
          <view class="p-4 rounded-2xl surface-card">
            <view class="text-sm text-slate-600 font-medium">房间不存在或参数缺失。</view>
          </view>
        </view>

        <view v-else-if="room.status !== 'empty'" class="px-5 pt-3 pb-5 stack-3">
          <view class="p-4 rounded-2xl surface-card">
            <view class="font-black text-slate-800">该房间当前已在租</view>
            <view class="text-sm text-slate-600 font-medium mt-2 leading-relaxed">
              只有空置房才能办理入住。你可以直接查看房间详情，或先完成退租后再重新入住。
            </view>
          </view>
          <button class="w-full py-4 rounded-xl btn-blue font-bold tap-scale" @click="goRoomDetail">前往房间详情</button>
        </view>

        <view v-else class="px-5 pt-3 pb-5">
          <view v-if="tab === 'history'" class="stack-2">
            <view class="p-4 rounded-2xl surface-card">
              <view class="flex items-center justify-between">
                <view class="font-black text-slate-800">历史入住</view>
                <view class="text-2xs text-slate-400 font-bold">{{ historyTimelineItems.length }} 段</view>
              </view>
              <view class="mt-3">
                <OccupancyTimeline :occupancies="historyTimelineItems" />
              </view>
            </view>
            <view class="h-16"></view>
          </view>

          <view v-else class="stack-2">
            <view class="p-3 rounded-2xl surface-card">
              <button class="w-full flex items-center justify-between bg-transparent p-0 text-left tap-scale" @click="roomOverviewExpanded = !roomOverviewExpanded">
                <view class="text-xs text-slate-400 font-bold">房间概况</view>
                <view class="text-2xs text-slate-400 font-bold">{{ roomOverviewExpanded ? '收起' : '展开' }}</view>
              </button>
              <view v-if="roomOverviewExpanded" class="mt-2">
                <view class="text-base font-black text-slate-800">{{ room.roomNo }}</view>
                <view class="text-xs text-slate-500 font-medium mt-1">当前为空置房，确认入住后会生成首期账期并写入入住历史。</view>

                <view class="mt-3 flex items-center gap-2 overflow-hidden">
                  <button class="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 tap-scale shrink-0 flex flex-col items-center justify-center" @click="handleRoomPhotoUpload">
                    <text class="text-sm font-black leading-none">+</text>
                    <text class="text-2xs font-medium mt-0_5">上传</text>
                  </button>
                  <scroll-view scroll-x class="flex-1 min-w-0 whitespace-nowrap overflow-hidden">
                    <view class="inline-flex gap-2">
                      <view
                        v-for="photo in roomPhotos.slice(0, 6)"
                        :key="photo.id"
                        class="w-11 h-11 px-2 rounded-xl border border-slate-200 bg-slate-50 inline-flex flex-col justify-end overflow-hidden shrink-0"
                      >
                        <view class="text-2xs font-black text-slate-700 truncate">{{ room.roomNo }}</view>
                        <view class="text-2xs text-slate-400 truncate">{{ photo.name }}</view>
                      </view>
                      <view v-if="roomPhotos.length === 0" class="w-11 h-11 px-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 inline-flex items-center justify-center text-2xs text-slate-400 font-bold shrink-0">暂无</view>
                    </view>
                  </scroll-view>
                </view>
              </view>
            </view>

            <view class="p-3 rounded-2xl surface-card">
              <button class="w-full flex items-center justify-between bg-transparent p-0 text-left tap-scale" @click="currentTenantExpanded = !currentTenantExpanded">
                <view class="text-xs text-slate-500 font-bold">当前租客</view>
                <view class="text-2xs text-slate-400 font-bold">{{ currentTenantExpanded ? '收起' : '展开' }}</view>
              </button>
              <view v-if="currentTenantExpanded" class="flex items-end justify-between gap-3 mt-3">
                <view class="min-w-0 flex-1">
                  <input v-model="form.tenant" type="text" class="tenant-inline-input" placeholder="请输入租客姓名" />
                  <input v-model="form.phone" type="text" class="tenant-inline-input mt-2" placeholder="请输入手机号" />
                </view>
                <button
                  class="detail-side-button tap-scale"
                  :class="attachments.idCard ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'"
                  @click="pickAttachment('idCard')"
                >
                  <view class="detail-side-button-text" :class="attachments.idCard ? 'text-emerald-800' : 'text-slate-700'">
                    {{ attachments.idCard ? '查看身份证' : '上传身份证' }}
                  </view>
                </button>
                <button
                  class="detail-side-button tap-scale"
                  :class="attachments.contract ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'"
                  @click="pickAttachment('contract')"
                >
                  <view class="detail-side-button-text" :class="attachments.contract ? 'text-emerald-800' : 'text-slate-700'">
                    {{ attachments.contract ? '查看合同' : '上传合同' }}
                  </view>
                </button>
              </view>
            </view>

            <view class="p-3 rounded-2xl surface-card">
              <view class="text-base font-bold text-slate-900">租金与租期</view>

              <view class="grid grid-cols-2 gap-2 mt-2">
                <view class="compact-section">
                  <view class="compact-field-label">租金（每期）</view>
                  <input v-model="form.rent" type="number" class="checkin-input mt-1_5" placeholder="请输入租金" />
                </view>
                <view class="compact-section">
                  <view class="compact-field-label">押金</view>
                  <input v-model="form.deposit" type="number" class="checkin-input mt-1_5" placeholder="请输入押金" />
                </view>
              </view>

              <view class="compact-section mt-2">
                <view class="compact-field-label">支付周期</view>
                <view class="flex gap-2 mt-1_5 flex-wrap items-center">
                  <button
                    v-for="opt in cycleOptions"
                    :key="opt.value"
                    class="cycle-option-button tap-scale"
                    :class="Number(form.paymentCycle) === opt.value ? 'cycle-option-active' : 'cycle-option-default'"
                    @click="form.paymentCycle = String(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                  <input v-model="form.paymentCycle" type="number" class="checkin-cycle-input" placeholder="月数" />
                </view>
              </view>

              <view class="grid grid-cols-2 gap-2 mt-2">
                <view class="compact-section">
                  <view class="compact-field-label">租期开始</view>
                  <button class="checkin-picker text-left tap-scale mt-1_5" @click="dateDrawerOpen = true">
                    {{ form.leaseStart }}
                  </button>
                  <view class="compact-inline-note mt-1">
                    <text class="compact-inline-note-label">预计到期</text>
                    <text class="compact-inline-note-value">{{ leaseEndPreview || '请先填写租期月数' }}</text>
                  </view>
                </view>
                <view class="compact-section">
                  <view class="compact-field-label">租期月数</view>
                  <input v-model="form.leaseMonths" type="number" class="checkin-input mt-1_5" placeholder="请输入月数" />
                </view>
              </view>
            </view>

            <view class="h-24"></view>
          </view>
        </view>
      </scroll-view>

      <view v-if="room && room.status === 'empty' && tab === 'current'" class="absolute inset-x-0 bottom-0 bg-white border-t border-slate-200-60">
        <view class="px-5 py-3 flex items-center gap-2">
          <button class="footer-secondary-button tap-scale" @click="resetForm">重置</button>
          <button class="footer-primary-button tap-scale" @click="confirmCheckIn">确认收款并入住</button>
        </view>
      </view>
    </view>

    <InnerDrawer v-if="dateDrawerOpen" :open="dateDrawerOpen" title="选择租期开始" compact @close="dateDrawerOpen = false">
      <view class="stack-2">
        <view class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
          <button class="date-step-button tap-scale" @click="shiftLeaseStart(-1)">前一天</button>
          <view class="text-center min-w-0 flex-1">
            <view class="text-sm font-black text-slate-800">{{ form.leaseStart }}</view>
            <view class="text-2xs text-slate-400 mt-1">默认当前日期，可向前或向后调整</view>
          </view>
          <button class="date-step-button tap-scale" @click="shiftLeaseStart(1)">后一天</button>
        </view>

        <view class="grid grid-cols-3 gap-2">
          <button class="date-chip tap-scale" @click="shiftLeaseStart(-30)">前30天</button>
          <button class="date-chip tap-scale" @click="setLeaseStart(todayString)">今天</button>
          <button class="date-chip tap-scale" @click="shiftLeaseStart(30)">后30天</button>
        </view>
      </view>

      <template #footer>
        <button class="w-full py-3 rounded-xl btn-blue font-bold tap-scale" @click="dateDrawerOpen = false">确认日期</button>
      </template>
    </InnerDrawer>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { cloneProperties, findBlock, findProperty, findRoomWithFloor, generatePaymentSchedule, setProperties } from '../../data/rentStore'
import OccupancyTimeline from '../../components/OccupancyTimeline.vue'
import InnerDrawer from '../../components/InnerDrawer.vue'
import { safeNavigateBack, safeRedirectTo } from '../../utils/navigation'
import { getDrawerHeaderTopPadding } from '../../utils/layout'
import { checkInRoom, createRoomTreeMutator, uploadRoomPhoto } from '../../domain/rent-room-service'

const headerTopPadding = ref(44)
const propertyId = ref('')
const blockId = ref('')
const roomId = ref('')
const tab = ref('current')
const dateDrawerOpen = ref(false)
const roomOverviewExpanded = ref(true)
const currentTenantExpanded = ref(true)

const property = computed(() => (propertyId.value ? findProperty(propertyId.value) : null))
const block = computed(() => (propertyId.value && blockId.value ? findBlock(propertyId.value, blockId.value) : null))
const roomWithFloor = computed(() => (propertyId.value && blockId.value && roomId.value ? findRoomWithFloor(propertyId.value, blockId.value, roomId.value) : null))
const room = computed(() => roomWithFloor.value?.room || null)
const roomPhotos = computed(() => room.value?.roomPhotos || [])
const roomLocationText = computed(() => [property.value?.name, block.value?.name].filter(Boolean).join(' · '))
const historyOccupancies = computed(() => (room.value?.occupancies || []).filter((occupancy) => occupancy.kind === 'lease'))
const historyTimelineItems = computed(() =>
  historyOccupancies.value.map((occupancy) => ({
    ...occupancy,
    rentTotal: occupancyRentTotal(occupancy),
    extraTotal: occupancyExtraCollectionTotal(occupancy),
  }))
)

const cycleOptions = [
  { value: 1, label: '月付' },
  { value: 3, label: '季付' },
  { value: 6, label: '半年付' },
  { value: 12, label: '年付' },
]

const todayString = formatDate(new Date())

const form = ref({
  rent: '',
  deposit: '',
  paymentCycle: '3',
  leaseStart: todayString,
  leaseMonths: '12',
  tenant: '',
  phone: '',
})

const attachments = ref({ idCard: null, contract: null })
const leaseEndPreview = computed(() => resolveLeaseEnd(form.value.leaseStart, form.value.leaseMonths))

onLoad((query) => {
  headerTopPadding.value = getDrawerHeaderTopPadding(24)
  propertyId.value = String(query?.propertyId || '')
  blockId.value = String(query?.blockId || '')
  roomId.value = String(query?.roomId || '')

  if (room.value) {
    form.value.rent = String(room.value.rent || '')
    form.value.deposit = String(room.value.deposit || '')
    form.value.paymentCycle = String(room.value.paymentCycle || 3)
  }
})

function closeSelf() {
  safeNavigateBack({ fallbackUrl: '/pages/workbench/index', fallbackType: 'switchTab' })
}

function goRoomDetail() {
  safeRedirectTo(`/pages/room/detail?propertyId=${propertyId.value}&blockId=${blockId.value}&roomId=${roomId.value}`)
}

function resetForm() {
  if (!room.value) return
  form.value = {
    rent: String(room.value.rent || ''),
    deposit: String(room.value.deposit || ''),
    paymentCycle: String(room.value.paymentCycle || 3),
    leaseStart: todayString,
    leaseMonths: '12',
    tenant: '',
    phone: '',
  }
  attachments.value = { idCard: null, contract: null }
  roomOverviewExpanded.value = true
  currentTenantExpanded.value = true
  uni.showToast({ title: '已重置', icon: 'none' })
}

function nowString() {
  const date = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDate(dateString) {
  if (!dateString) return null
  const date = new Date(`${dateString}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function setLeaseStart(nextValue) {
  form.value.leaseStart = nextValue
}

function shiftLeaseStart(days) {
  const current = parseDate(form.value.leaseStart) || new Date()
  current.setDate(current.getDate() + days)
  form.value.leaseStart = formatDate(current)
}

function resolveLeaseEnd(startDate, monthsValue) {
  const start = parseDate(startDate)
  const months = Number(monthsValue)
  if (!start || !Number.isFinite(months) || months <= 0) return ''
  const end = new Date(start)
  end.setMonth(end.getMonth() + months)
  end.setDate(end.getDate() - 1)
  return formatDate(end)
}

function buildAttachmentFile(type) {
  const now = nowString()
  if (type === 'idCard') {
    return {
      name: `${form.value.tenant.trim() || '租客'}_id_card.jpg`,
      uploadedAt: now,
      source: 'mock',
      previewText: '身份证正反面影像（模拟）',
    }
  }

  return {
    name: `${room.value?.roomNo || 'room'}_lease_contract.pdf`,
    uploadedAt: now,
    source: 'mock',
    previewText: '已签署租赁合同（模拟）',
  }
}

function pickAttachment(type) {
  if (type === 'idCard') attachments.value.idCard = buildAttachmentFile('idCard')
  if (type === 'contract') attachments.value.contract = buildAttachmentFile('contract')
  uni.showToast({ title: '已上传（模拟）', icon: 'none' })
}

function handleRoomPhotoUpload() {
  const nextProperties = cloneProperties()
  const hit = createRoomTreeMutator(nextProperties, propertyId.value, blockId.value, roomId.value)
  if (!hit) return
  uploadRoomPhoto(hit.room, { now: nowString() })
  setProperties(nextProperties)
  uni.showToast({ title: '已上传房屋图片', icon: 'none' })
}

function occupancyRentTotal(occupancy) {
  if (!occupancy) return 0
  const paymentSchedule = occupancy.archive?.paymentSchedule || []
  if (paymentSchedule.length > 0) return paymentSchedule.reduce((sum, item) => sum + Number(item.expectedAmount || 0), 0)
  return Number(occupancy.rent || 0)
}

function occupancyExtraCollectionTotal(occupancy) {
  if (!occupancy) return 0
  const collections = occupancy.archive?.collections || []
  return collections.filter((item) => item.kind !== 'rent').reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

function confirmCheckIn() {
  if (!room.value) return
  if (!form.value.tenant.trim()) return uni.showToast({ title: '请填写租客姓名', icon: 'none' })

  const rent = Number(form.value.rent)
  const deposit = Number(form.value.deposit)
  const paymentCycle = Number(form.value.paymentCycle)
  const leaseMonths = Number(form.value.leaseMonths)
  if (!Number.isFinite(rent) || rent <= 0 || !Number.isFinite(deposit) || deposit < 0 || !Number.isFinite(paymentCycle) || paymentCycle <= 0) {
    return uni.showToast({ title: '请完善租金、押金和周期', icon: 'none' })
  }
  if (!Number.isFinite(leaseMonths) || leaseMonths <= 0) {
    return uni.showToast({ title: '请填写租期月数', icon: 'none' })
  }
  if (!attachments.value.idCard || !attachments.value.contract) {
    return uni.showToast({ title: '请先上传身份证和合同', icon: 'none' })
  }

  const now = nowString()
  const leaseStart = form.value.leaseStart || todayString
  const leaseEnd = resolveLeaseEnd(leaseStart, form.value.leaseMonths)

  const nextProperties = cloneProperties()
  const hit = createRoomTreeMutator(nextProperties, propertyId.value, blockId.value, roomId.value)
  if (!hit) return

  const paymentSchedule = generatePaymentSchedule({
    startDate: leaseStart,
    endDate: leaseEnd,
    cycleMonths: paymentCycle,
    rentPerCycle: rent,
  })

  checkInRoom(
    hit.room,
    {
      tenant: form.value.tenant.trim(),
      phone: form.value.phone.trim(),
      idCard: '',
      rent,
      deposit,
      paymentCycle,
      leaseStart,
      leaseEnd,
    },
    {
      now,
      paymentSchedule,
      attachments: {
        idCard: attachments.value.idCard,
        contract: attachments.value.contract,
      },
    }
  )

  setProperties(nextProperties)
  uni.showToast({ title: '已办理入住', icon: 'success' })
  safeRedirectTo(`/pages/room/detail?propertyId=${propertyId.value}&blockId=${blockId.value}&roomId=${roomId.value}`)
}
</script>

<style>
.drawer-page-panel {
  animation: room-sheet-enter 220ms ease-out;
  transform-origin: bottom center;
}

.tenant-inline-input {
  width: 100%;
  min-height: 36rpx;
  padding: 2rpx 0;
  background: transparent;
  border: 0;
  box-sizing: border-box;
  font-size: 26rpx;
  line-height: 1.4;
  color: #0f172a;
  font-weight: 500;
}

.tenant-inline-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.detail-side-button {
  min-width: 112rpx;
  padding: 16rpx 18rpx;
  border-radius: 14rpx;
  border-width: 1rpx;
  text-align: center;
  flex-shrink: 0;
}

.detail-side-button-text {
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.1;
}

.checkin-input {
  width: 100%;
  height: 68rpx;
  padding: 10rpx 20rpx;
  border-radius: 18rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  background: #ffffff;
  box-sizing: border-box;
  line-height: 1.2;
  font-size: 26rpx;
  color: #0f172a;
  font-weight: 500;
}

.checkin-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.checkin-picker {
  width: 100%;
  height: 68rpx;
  padding: 0 20rpx;
  border-radius: 18rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  background: #ffffff;
  box-sizing: border-box;
  line-height: 68rpx;
  font-size: 26rpx;
  color: #0f172a;
  font-weight: 500;
}

.checkin-cycle-input {
  width: 96rpx;
  height: 60rpx;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  background: #ffffff;
  box-sizing: border-box;
  line-height: 1.2;
  font-size: 24rpx;
  color: #0f172a;
  font-weight: 500;
}

.compact-section {
  padding: 8rpx 0;
}

.compact-field-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #334155;
}

.compact-inline-note {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.compact-inline-note-label {
  font-size: 20rpx;
  color: #94a3b8;
  font-weight: 500;
  white-space: nowrap;
}

.compact-inline-note-value {
  font-size: 22rpx;
  color: #334155;
  font-weight: 600;
  min-width: 0;
  line-height: 1.3;
}

.cycle-option-button {
  min-width: 92rpx;
  padding: 14rpx 18rpx;
  border-radius: 16rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1;
}

.cycle-option-default {
  background: #ffffff;
  color: #475569;
}

.cycle-option-active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.footer-secondary-button {
  flex: 1;
  padding: 22rpx 20rpx;
  border-radius: 9999rpx;
  background: #ffffff;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  color: #0f172a;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
}

.footer-primary-button {
  flex: 1.4;
  padding: 22rpx 20rpx;
  border-radius: 9999rpx;
  background: linear-gradient(135deg, #34d399, #4ade80);
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 12rpx 24rpx rgba(52, 211, 153, 0.18);
}

.date-step-button {
  min-width: 120rpx;
  height: 64rpx;
  padding: 0 18rpx;
  border-radius: 18rpx;
  background: #ffffff;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  font-size: 22rpx;
  font-weight: 700;
  color: #334155;
}

.date-chip {
  height: 60rpx;
  border-radius: 16rpx;
  background: #f8fafc;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  font-size: 22rpx;
  font-weight: 700;
  color: #475569;
}

@keyframes room-sheet-enter {
  from {
    transform: translateY(36px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
