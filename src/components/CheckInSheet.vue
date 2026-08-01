<template>
  <view v-if="open" class="fixed inset-0 z-50 bg-slate-900-50 flex items-end justify-center" @click="emit('close')">
    <view class="w-full max-w-md drawer-page-panel sheet-font-boost flex flex-col bg-slate-50 rounded-t-3xl shadow-2xl relative overflow-hidden" @click.stop>
      <view class="bg-white-80 px-5 pb-3 shrink-0" :style="{ paddingTop: headerTopPadding + 'px' }">
        <view class="flex justify-center"><view class="w-10 h-1 rounded-full bg-slate-300 mt-1"></view></view>
        <view class="flex items-center justify-between gap-3 mt-2">
          <view class="flex items-center gap-3 min-w-0">
            <view class="nav-icon-button tap-scale" @click="emit('close')"><view class="icon-close"><view class="icon-close-line"></view><view class="icon-close-line icon-close-line-second"></view></view></view>
            <view class="min-w-0">
              <view class="font-black text-slate-900 text-lg truncate">办理入住</view>
              <view class="text-xs text-slate-400 font-medium mt-0_5 truncate">{{ roomLocationText }}</view>
            </view>
          </view>
          <view v-if="room" class="text-xs font-bold px-3 py-1 rounded-full chip-soft text-slate-700">{{ room.roomNo }} {{ room.status === 'empty' ? '空置' : '已租' }}</view>
        </view>
        <view class="mt-3">
          <view class="p-1 surface-muted rounded-2xl flex gap-1">
            <view class="flex-1 py-2 rounded-xl text-sm font-bold tap-scale text-center" :class="tab==='current'?'bg-white text-slate-900 shadow-soft':'bg-transparent text-slate-500'" @click="tab='current'">当前情况</view>
            <view class="flex-1 py-2 rounded-xl text-sm font-bold tap-scale text-center" :class="tab==='history'?'bg-white text-slate-900 shadow-soft':'bg-transparent text-slate-500'" @click="tab='history'">历史入住</view>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="drawer-scroll-area" :scroll-with-animation="true" enable-flex>
        <view v-if="!room" class="px-5 pt-3 pb-5"><view class="p-4 rounded-2xl surface-card"><view class="text-sm text-slate-600 font-medium">房间不存在或参数缺失。</view></view></view>
        <view v-else-if="room.status !== 'empty'" class="px-5 pt-3 pb-5 stack-3">
          <view class="p-4 rounded-2xl surface-card"><view class="font-bold text-slate-800">该房间当前已入住</view><view class="text-sm text-slate-600 font-medium mt-2 leading-relaxed">只有空置房才能办理入住。可先查看详情或办理退租。</view></view>
          <button class="w-full py-4 rounded-xl btn-blue font-semibold tap-scale" @click="emit('request-detail')">前往房间详情</button>
        </view>
        <view v-else class="px-5 pt-3 pb-5">
          <view v-if="tab==='history'" class="stack-2">
            <view class="p-4 rounded-2xl surface-card">
              <view class="flex items-center justify-between"><view class="font-bold text-slate-800">历史入住</view><view class="text-2xs text-slate-400 font-medium">{{ historyTimelineItems.length }} 段</view></view>
              <view class="mt-3"><OccupancyTimeline :occupancies="historyTimelineItems" /></view>
            </view>
            <view class="h-16"></view>
          </view>
          <view v-else class="stack-2">
            <CollapsibleSectionCard title="房间概况" :expanded="roomOverviewExpanded" title-class="text-sm text-slate-700 font-bold" @toggle="roomOverviewExpanded=!roomOverviewExpanded">
              <view class="text-base font-bold text-slate-800">{{ room.roomNo }}</view>
              <view class="text-sm text-slate-500 font-medium mt-1 leading-relaxed">当前为空置房，确认后会生成首期账期并写入历史。</view>
              <view class="mt-3 flex items-center gap-2 overflow-hidden">
                <button class="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 tap-scale shrink-0 flex flex-col items-center justify-center" @click="handleRoomPhotoUpload"><text class="text-sm font-semibold leading-none">+</text><text class="text-2xs font-medium mt-0_5">上传</text></button>
                <scroll-view scroll-x class="flex-1 min-w-0 whitespace-nowrap overflow-hidden"><view class="inline-flex gap-2"><button v-for="(photo, index) in roomPhotos.slice(0, 9)" :key="photo.id" class="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 tap-scale" @click="previewFiles(roomPhotos, index)"><image v-if="resolveOfflineImageSrc(photo)" :src="resolveOfflineImageSrc(photo)" mode="aspectFill" class="w-full h-full" /><view v-else class="w-full h-full flex items-center justify-center text-2xs text-slate-400 font-medium">图片</view></button><view v-if="roomPhotos.length===0" class="w-11 h-11 px-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 inline-flex items-center justify-center text-2xs text-slate-400 font-bold shrink-0">暂无</view></view></scroll-view>
              </view>
            </CollapsibleSectionCard>

            <CheckInTenantSection
              :expanded="currentTenantExpanded"
              :tenant="form.tenant"
              :phone="form.phone"
              :id-cards="attachments.idCard"
              :contracts="attachments.contract"
              :can-manage="canManageTenantData"
              @toggle="currentTenantExpanded=!currentTenantExpanded"
              @update:tenant="form.tenant = $event"
              @update:phone="form.phone = $event"
              @pick-id-card="pickAttachment('idCard')"
              @pick-contract="pickAttachment('contract')"
              @preview-id-card="previewFiles(attachments.idCard)"
              @preview-contract="previewFiles(attachments.contract)"
            />

            <CollapsibleSectionCard title="租金与租期" :expanded="leaseExpanded" title-class="text-sm text-slate-700 font-bold" @toggle="leaseExpanded=!leaseExpanded">
              <view class="grid grid-cols-2 gap-2"><view><view class="compact-field-label">租金（每期）</view><input v-model="form.rent" type="number" class="checkin-input mt-1_5" placeholder="请输入租金" /></view><view><view class="compact-field-label">押金</view><input v-model="form.deposit" type="number" class="checkin-input mt-1_5" placeholder="请输入押金" /></view></view>
              <view class="mt-3"><view class="compact-field-label">支付周期</view><view class="flex gap-2 mt-1_5 flex-wrap items-center"><button v-for="opt in cycleOptions" :key="opt.value" class="cycle-option-button tap-scale" :class="Number(form.paymentCycle)===opt.value?'cycle-option-active':'cycle-option-default'" @click="form.paymentCycle=String(opt.value)">{{ opt.label }}</button><view class="checkin-cycle-input-wrap"><input v-model="form.paymentCycle" type="number" class="checkin-cycle-input" placeholder="月数" /><text class="checkin-cycle-unit">个月</text></view></view></view>
              <view class="grid grid-cols-2 gap-3 mt-3"><view><view class="compact-field-label">租期开始</view><input v-model="form.leaseStart" type="text" class="checkin-input mt-1_5" placeholder="YYYY-MM-DD" @blur="normalizeLeaseStart" /><view class="compact-inline-note mt-1"><text class="compact-inline-note-label">预计到期</text><text class="compact-inline-note-value">{{ leaseEndPreview || '请先填写租期月数' }}</text></view></view><view><view class="compact-field-label">租期月数</view><input v-model="form.leaseMonths" type="number" class="checkin-input mt-1_5" placeholder="请输入月数" /></view></view>
            </CollapsibleSectionCard>

            <CheckInChargeSection
              :expanded="chargeExpanded"
              :rent-amount="formattedCheckInCharge"
              :deposit-amount="formattedDepositCharge"
              :rent-charged="checkInChargeConfirmed"
              :deposit-charged="depositChargeConfirmed"
              @toggle="chargeExpanded=!chargeExpanded"
              @rent-collect="checkInCollectOpen=true"
              @deposit-collect="depositCollectOpen=true"
            />

            <CheckInUtilityConfigSection
              :expanded="utilityExpanded"
              :options="utilityChargeOptions"
              :water-charge-mode="form.waterChargeMode"
              :electric-charge-mode="form.electricChargeMode"
              :gas-charge-mode="form.gasChargeMode"
              :heating-charge-mode="form.heatingChargeMode"
              :water-base="form.waterBase"
              :electric-base="form.electricBase"
              @toggle="utilityExpanded=!utilityExpanded"
              @update:waterChargeMode="form.waterChargeMode = $event"
              @update:electricChargeMode="form.electricChargeMode = $event"
              @update:gasChargeMode="form.gasChargeMode = $event"
              @update:heatingChargeMode="form.heatingChargeMode = $event"
              @update:waterBase="form.waterBase = $event"
              @update:electricBase="form.electricBase = $event"
            />
          </view>
        </view>
      </scroll-view>

      <view v-if="room && room.status==='empty' && tab==='current'" class="drawer-action-bar"><ActionFooterRow secondary-label="重置" primary-label="确认收款并入住" primary-class="checkin-primary-action" @secondary="resetForm" @primary="confirmCheckIn" /></view>
    </view>

    <ChargeCollectDrawer :open="checkInCollectOpen" title="入住收费" subtitle="填写本次收费，凭证可选上传" hero-label="首期应收" :hero-badge="checkInChargeConfirmed?'已确认':'待收费'" :hero-amount="formattedCheckInCharge" left-label="支付周期" :left-value="paymentCycleLabel" right-label="租期开始" :right-value="form.leaseStart" input-label="本次实收金额" :model-value="checkInChargeAmount" placeholder="0.00" :receipt-picked="checkInReceiptPicked" :receipt-file-name="checkInReceiptFile?.name || '未上传凭证'" confirm-label="确认收费" :confirm-disabled="!canConfirmCheckInCharge" @close="checkInCollectOpen=false" @update:modelValue="checkInChargeAmount=$event" @pick-receipt="pickCheckInReceipt" @confirm="confirmCheckInCharge" />
    <ChargeCollectDrawer :open="depositCollectOpen" title="押金收费" subtitle="填写本次押金，凭证可选上传" hero-label="押金应收" :hero-badge="depositReceiptPicked?'已配置':'待收费'" :hero-amount="formattedDepositCharge" left-label="押金约定" :left-value="`￥${Number(form.deposit || 0).toFixed(2)}`" right-label="租期开始" :right-value="form.leaseStart" input-label="本次押金金额" :model-value="depositChargeAmount" placeholder="0.00" :receipt-picked="depositReceiptPicked" :receipt-file-name="depositReceiptFile?.name || '未上传凭证'" confirm-label="确认收费" :confirm-disabled="!canConfirmDepositCharge" @close="depositCollectOpen=false" @update:modelValue="depositChargeAmount=$event" @pick-receipt="pickDepositReceipt" @confirm="confirmDepositCharge" />
  </view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import OccupancyTimeline from './OccupancyTimeline.vue'
import CollapsibleSectionCard from './CollapsibleSectionCard.vue'
import CheckInTenantSection from './CheckInTenantSection.vue'
import CheckInChargeSection from './CheckInChargeSection.vue'
import CheckInUtilityConfigSection from './CheckInUtilityConfigSection.vue'
import ActionFooterRow from './ActionFooterRow.vue'
import ChargeCollectDrawer from './ChargeCollectDrawer.vue'
import { cloneProperties, findBlock, findProperty, findRoomWithFloor, generatePaymentSchedule, mergeCloudRoomDetail, setProperties } from '../data/rentStore'
import { canManageTenantData } from '../data/authStore'
import { getDrawerHeaderTopPadding } from '../utils/layout'
import { checkInRoom, createRoomTreeMutator, recordRoomOperation, uploadRoomPhoto } from '../domain/rent-room-service'
import { ATTACHMENT_FILE_LIMITS, ROOM_PHOTO_LIMIT } from '../domain/rent-models.js'
import { canUseCloudBackup, hasCloudApiBaseUrl } from '../config/cloud'
import { enqueueSyncTask } from '../data/syncQueue.js'
import { PAYMENT_STATUS } from '../domain/rent-models.js'
import { chooseImages, chooseSingleImage, previewChosenImages, resolveOfflineImageSrc } from '../utils/media'
import { isValidMainlandPhone, normalizeDateInput, parseNonNegativeNumber, parsePositiveAmount, parsePositiveInteger } from '../utils/validation'

const props = defineProps({ open: { type: Boolean, default: false }, propertyId: { type: String, default: '' }, blockId: { type: String, default: '' }, roomId: { type: String, default: '' } })
const emit = defineEmits(['close', 'checked-in', 'request-detail'])

const headerTopPadding = ref(getDrawerHeaderTopPadding(24))
const tab = ref('current')
const roomOverviewExpanded = ref(true)
const currentTenantExpanded = ref(true)
const leaseExpanded = ref(true)
const chargeExpanded = ref(true)
const utilityExpanded = ref(true)
const checkInCollectOpen = ref(false)
const depositCollectOpen = ref(false)
const checkInChargeAmount = ref('')
const depositChargeAmount = ref('')
const checkInChargeConfirmed = ref(false)
const checkInReceiptFile = ref(null)
const depositReceiptFile = ref(null)
const depositChargeConfirmed = ref(false)

const property = computed(() => (props.propertyId ? findProperty(props.propertyId) : null))
const block = computed(() => (props.propertyId && props.blockId ? findBlock(props.propertyId, props.blockId) : null))
const roomWithFloor = computed(() => (props.propertyId && props.blockId && props.roomId ? findRoomWithFloor(props.propertyId, props.blockId, props.roomId) : null))
const room = computed(() => roomWithFloor.value?.room || null)
const roomPhotos = computed(() => room.value?.roomPhotos || [])
const roomLocationText = computed(() => [property.value?.name, block.value?.name].filter(Boolean).join(' · '))
const historyOccupancies = computed(() => (room.value?.occupancies || []).filter((item) => item.kind === 'lease'))
const historyTimelineItems = computed(() => historyOccupancies.value.map((item) => ({ ...item, rentTotal: occupancyRentTotal(item), extraTotal: occupancyExtraCollectionTotal(item) })))

const cycleOptions = [{ value: 1, label: '月付' }, { value: 3, label: '季付' }, { value: 6, label: '半年付' }, { value: 12, label: '年付' }]
const utilityChargeOptions = [{ value: 'included', label: '房租已包含' }, { value: 'separate', label: '单独收费' }]
const todayString = formatDate(new Date())

const form = ref({ rent: '', deposit: '', paymentCycle: '3', leaseStart: todayString, leaseMonths: '12', tenant: '', phone: '', waterChargeMode: 'separate', electricChargeMode: 'separate', gasChargeMode: 'separate', heatingChargeMode: 'separate', waterBase: '', electricBase: '' })
const attachments = ref({ idCard: [], contract: [] })

const leaseEndPreview = computed(() => resolveLeaseEnd(form.value.leaseStart, form.value.leaseMonths))
const paymentCycleLabel = computed(() => cycleOptions.find((item) => item.value === Number(form.value.paymentCycle))?.label || `${form.value.paymentCycle || 0} 个月`)
const defaultCheckInCharge = computed(() => {
  const rent = Number(form.value.rent)
  const cycle = Number(form.value.paymentCycle)
  return Number.isFinite(rent) && rent > 0 && Number.isFinite(cycle) && cycle > 0 ? Number((rent * cycle).toFixed(2)) : 0
})
const defaultDepositCharge = computed(() => {
  const deposit = Number(form.value.deposit)
  return Number.isFinite(deposit) && deposit > 0 ? Number(deposit.toFixed(2)) : 0
})
const formattedCheckInCharge = computed(() => Number(checkInChargeAmount.value || defaultCheckInCharge.value || 0).toFixed(2))
const formattedDepositCharge = computed(() => Number(depositChargeAmount.value || defaultDepositCharge.value || 0).toFixed(2))
const checkInReceiptPicked = computed(() => Boolean(checkInReceiptFile.value))
const depositReceiptPicked = computed(() => Boolean(depositReceiptFile.value))
const canConfirmCheckInCharge = computed(() => Boolean(parsePositiveAmount(checkInChargeAmount.value)))
const canConfirmDepositCharge = computed(() => Boolean(parsePositiveAmount(depositChargeAmount.value)))

function initializeCheckInState() {
  if (!props.open || !room.value) return
  tab.value = 'current'
  roomOverviewExpanded.value = true
  currentTenantExpanded.value = true
  leaseExpanded.value = true
  chargeExpanded.value = true
  utilityExpanded.value = true
  checkInCollectOpen.value = false
  depositCollectOpen.value = false
  checkInReceiptFile.value = null
  depositReceiptFile.value = null
  checkInChargeConfirmed.value = false
  depositChargeConfirmed.value = false
  form.value = {
    rent: String(room.value.rent || ''),
    deposit: String(room.value.deposit || ''),
    paymentCycle: String(room.value.paymentCycle || 3),
    leaseStart: todayString,
    leaseMonths: '12',
    tenant: '',
    phone: '',
    waterChargeMode: room.value.utilityChargeConfig?.water || 'separate',
    electricChargeMode: room.value.utilityChargeConfig?.electric || 'separate',
    gasChargeMode: room.value.utilityChargeConfig?.gas || 'separate',
    heatingChargeMode: room.value.utilityChargeConfig?.heating || 'separate',
    waterBase: String(room.value.lastWater ?? ''),
    electricBase: String(room.value.lastElectric ?? ''),
  }
  attachments.value = { idCard: [], contract: [] }
  checkInChargeAmount.value = defaultCheckInCharge.value > 0 ? String(defaultCheckInCharge.value) : ''
  depositChargeAmount.value = defaultDepositCharge.value > 0 ? String(defaultDepositCharge.value) : ''
}

onMounted(() => {
  initializeCheckInState()
})

watch(() => props.open, (opened, previous) => {
  if (opened && !previous) initializeCheckInState()
})

watch(() => room.value?.id, () => {
  if (props.open) initializeCheckInState()
})

watch(() => [form.value.rent, form.value.paymentCycle, form.value.deposit], (next, previous) => {
  if (!checkInReceiptPicked.value) checkInChargeAmount.value = defaultCheckInCharge.value > 0 ? String(defaultCheckInCharge.value) : ''
  if (!depositReceiptPicked.value) depositChargeAmount.value = defaultDepositCharge.value > 0 ? String(defaultDepositCharge.value) : ''
  if (previous && (next[0] !== previous[0] || next[1] !== previous[1])) checkInChargeConfirmed.value = false
  if (previous && next[2] !== previous[2]) depositChargeConfirmed.value = false
})

function nowString() {
  const d = new Date()
  const pad = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(date) {
  const pad = (v) => String(v).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeLeaseStart() { const normalized = normalizeDateInput(form.value.leaseStart); if (!normalized) return uni.showToast({ title: '请输入有效日期', icon: 'none' }); form.value.leaseStart = normalized }

function resolveLeaseEnd(startDate, monthsValue) {
  const start = parseDate(startDate)
  const months = Number(monthsValue)
  if (!start || !Number.isFinite(months) || months <= 0) return ''
  const end = new Date(start)
  end.setMonth(end.getMonth() + months)
  end.setDate(end.getDate() - 1)
  return formatDate(end)
}

function buildChosenFile(type, rawFile) {
  return {
    ...rawFile,
    uploadedAt: nowString(),
    name: rawFile.name || `${room.value?.roomNo || 'room'}_${type}_${Date.now()}.jpg`,
  }
}

function previewFiles(files, currentIndex = 0) {
  if (!previewChosenImages(files, currentIndex)) {
    uni.showToast({ title: '当前文件暂不支持预览', icon: 'none' })
  }
}

async function uploadRoomScopedFile(type, rawFile, { successTitle = '已上传图片', preview = false } = {}) {
  const prepared = buildChosenFile(type, rawFile)
  if (canUseCloudBackup() && type !== 'receipt') {
    enqueueSyncTask({
      type: 'attachment.upload',
      propertyId: props.propertyId,
      blockId: props.blockId,
      roomId: props.roomId,
      payload: {
        type,
        file: prepared,
      },
    })
    if (successTitle) uni.showToast({ title: '已加入同步队列', icon: 'success' })
    if (preview) previewFiles([prepared])
    return prepared
  }
  if (successTitle) uni.showToast({ title: type === 'receipt' ? '已保存本地凭证' : successTitle, icon: 'success' })
  if (preview) previewFiles([prepared])
  return prepared
}

async function pickAttachment(type) {
  const currentFiles = attachments.value[type] || []
  const limit = ATTACHMENT_FILE_LIMITS[type] || 1
  const remaining = limit - currentFiles.length
  if (remaining <= 0) return uni.showToast({ title: `最多上传 ${limit} 张图片`, icon: 'none' })
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权上传图片', icon: 'none' })
  try {
    const selected = await chooseImages({ fallbackPrefix: type, count: remaining })
    const files = await Promise.all(selected.map((file) => uploadRoomScopedFile(type, file, { successTitle: '' })))
    attachments.value[type] = [...currentFiles, ...files.filter(Boolean)].slice(0, limit)
    uni.showToast({ title: `${type === 'idCard' ? '身份证' : '合同'}已上传`, icon: 'success' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择图片失败', icon: 'none' })
  }
}

async function handleRoomPhotoUpload() {
  if (roomPhotos.value.length >= ROOM_PHOTO_LIMIT) return uni.showToast({ title: '房屋照片最多上传 9 张', icon: 'none' })
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权选择凭证', icon: 'none' })
  try {
    const remaining = ROOM_PHOTO_LIMIT - roomPhotos.value.length
    const chosen = await chooseImages({ fallbackPrefix: `${room.value?.roomNo || 'room'}_photo`, count: remaining })
    if (chosen.length === 0) return
    const preparedPhotos = chosen.map((file) => buildChosenFile('room_photo', file))
    if (canUseCloudBackup()) {
      const nextProperties = cloneProperties()
      const hit = createRoomTreeMutator(nextProperties, props.propertyId, props.blockId, props.roomId)
      if (!hit) return
      const uploaded = preparedPhotos
        .map((file) => uploadRoomPhoto(hit.room, { now: nowString(), file }))
        .filter(Boolean)
      if (uploaded.length === 0) return
      setProperties(nextProperties)
      uploaded.forEach((file) => enqueueSyncTask({
        type: 'attachment.upload',
        propertyId: props.propertyId,
        blockId: props.blockId,
        roomId: props.roomId,
        payload: { type: 'roomPhoto', file },
      }))
      uni.showToast({ title: `已上传 ${uploaded.length} 张照片`, icon: 'success' })
      return
    }
    const nextProperties = cloneProperties()
    const hit = createRoomTreeMutator(nextProperties, props.propertyId, props.blockId, props.roomId)
    if (!hit) return
    const uploaded = preparedPhotos
      .map((file) => uploadRoomPhoto(hit.room, { now: nowString(), file }))
      .filter(Boolean)
    if (uploaded.length === 0) return
    setProperties(nextProperties)
    uni.showToast({ title: `已上传 ${uploaded.length} 张照片`, icon: 'success' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择图片失败', icon: 'none' })
  }
}

function occupancyRentTotal(occupancy) {
  if (!occupancy) return 0
  const schedule = occupancy.archive?.paymentSchedule || []
  return schedule.length > 0 ? schedule.reduce((sum, item) => sum + Number(item.expectedAmount || 0), 0) : Number(occupancy.rent || 0)
}

function occupancyExtraCollectionTotal(occupancy) {
  if (!occupancy) return 0
  return (occupancy.archive?.collections || []).filter((item) => item.kind !== 'rent').reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

async function pickCheckInReceipt() {
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权选择凭证', icon: 'none' })
  try {
    checkInReceiptFile.value = await uploadRoomScopedFile('receipt', await chooseSingleImage({ fallbackPrefix: 'checkin_receipt' }), { successTitle: '已上传凭证' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择凭证失败', icon: 'none' })
  }
}

async function pickDepositReceipt() {
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权确认收费', icon: 'none' })
  try {
    depositReceiptFile.value = await uploadRoomScopedFile('receipt', await chooseSingleImage({ fallbackPrefix: 'deposit_receipt' }), { successTitle: '已上传凭证' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择凭证失败', icon: 'none' })
  }
}

function confirmCheckInCharge() {
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权确认收费', icon: 'none' })
  if (!parsePositiveAmount(checkInChargeAmount.value)) return uni.showToast({ title: '请输入有效收费金额', icon: 'none' })
  checkInChargeConfirmed.value = true
  checkInCollectOpen.value = false
  uni.showToast({ title: '入住收费已确认', icon: 'success' })
}

function confirmDepositCharge() {
  if (!canManageTenantData.value) return
  if (!parsePositiveAmount(depositChargeAmount.value)) return uni.showToast({ title: '请输入有效押金金额', icon: 'none' })
  depositChargeConfirmed.value = true
  depositCollectOpen.value = false
  uni.showToast({ title: '押金收费已确认', icon: 'success' })
}

function resetForm() {
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权重置表单', icon: 'none' })
  if (!room.value) return
  form.value = {
    rent: String(room.value.rent || ''),
    deposit: String(room.value.deposit || ''),
    paymentCycle: String(room.value.paymentCycle || 3),
    leaseStart: todayString,
    leaseMonths: '12',
    tenant: '',
    phone: '',
    waterChargeMode: room.value.utilityChargeConfig?.water || 'separate',
    electricChargeMode: room.value.utilityChargeConfig?.electric || 'separate',
    gasChargeMode: room.value.utilityChargeConfig?.gas || 'separate',
    heatingChargeMode: room.value.utilityChargeConfig?.heating || 'separate',
    waterBase: String(room.value.lastWater ?? ''),
    electricBase: String(room.value.lastElectric ?? ''),
  }
  attachments.value = { idCard: [], contract: [] }
  checkInReceiptFile.value = null
  depositReceiptFile.value = null
  checkInChargeConfirmed.value = false
  depositChargeConfirmed.value = false
  checkInChargeAmount.value = defaultCheckInCharge.value > 0 ? String(defaultCheckInCharge.value) : ''
  depositChargeAmount.value = defaultDepositCharge.value > 0 ? String(defaultDepositCharge.value) : ''
  uni.showToast({ title: '已重置', icon: 'none' })
}

function applyLocalCheckIn({
  tenant,
  phone,
  rent,
  deposit,
  paymentCycle,
  leaseMonths,
  waterBase,
  electricBase,
  collectionAmount,
}) {
  const now = nowString()
  const leaseStart = form.value.leaseStart || todayString
  const leaseEnd = resolveLeaseEnd(leaseStart, form.value.leaseMonths)
  const nextProperties = cloneProperties()
  const hit = createRoomTreeMutator(nextProperties, props.propertyId, props.blockId, props.roomId)
  if (!hit) return false
  const before = JSON.parse(JSON.stringify(hit.room))
  delete before.operationLog

  const paymentSchedule = generatePaymentSchedule({ startDate: leaseStart, endDate: leaseEnd, cycleMonths: paymentCycle, rentPerCycle: rent })
  checkInRoom(
    hit.room,
    {
      tenant,
      phone,
      idCard: '',
      rent,
      deposit,
      paymentCycle,
      leaseStart,
      leaseEnd,
      utilityChargeConfig: {
        water: form.value.waterChargeMode,
        electric: form.value.electricChargeMode,
        gas: form.value.gasChargeMode,
        heating: form.value.heatingChargeMode,
      },
      waterBase: waterBase === null ? Number(room.value.lastWater || 0) : waterBase,
      electricBase: electricBase === null ? Number(room.value.lastElectric || 0) : electricBase,
    },
    {
      now,
      paymentSchedule,
      attachments: { idCard: attachments.value.idCard, contract: attachments.value.contract },
      initialCollectionAmount: collectionAmount || 0,
      initialReceiptPicked: checkInReceiptPicked.value,
      initialReceiptFile: checkInReceiptFile.value,
      initialDepositAmount: depositChargeConfirmed.value ? Number(depositChargeAmount.value || 0) : 0,
      initialDepositReceiptPicked: depositChargeConfirmed.value && depositReceiptPicked.value,
      initialDepositReceiptFile: depositChargeConfirmed.value ? depositReceiptFile.value : null,
    }
  )
  hit.room.hasIdCardPic = attachments.value.idCard.length > 0
  hit.room.hasContract = attachments.value.contract.length > 0
  hit.room.attachmentFiles = {
    idCard: attachments.value.idCard,
    contract: attachments.value.contract,
  }
  if (!collectionAmount && Array.isArray(hit.room.paymentSchedule) && hit.room.paymentSchedule.length > 0) {
    const firstTerm = hit.room.paymentSchedule[0]
    firstTerm.paidAmount = 0
    firstTerm.coveredAmount = 0
    firstTerm.payDate = ''
    firstTerm.receiptPic = false
    firstTerm.receiptFile = null
    firstTerm.status = PAYMENT_STATUS.UNPAID
    hit.room.collections = (hit.room.collections || []).filter((item) => !(item.kind === 'rent' && Array.isArray(item.termIds) && item.termIds.includes(firstTerm.id)))
  }
  recordRoomOperation(hit.room, { kind: 'checkin', label: '办理入住', now, before })
  setProperties(nextProperties)
  return true
}

async function confirmCheckIn() {
  if (!canManageTenantData.value) return uni.showToast({ title: '当前角色无权办理入住', icon: 'none' })
  if (!room.value) return
  const tenant = String(form.value.tenant || '').trim()
  const phone = String(form.value.phone || '').trim()
  const rent = parsePositiveAmount(form.value.rent)
  const deposit = parseNonNegativeNumber(form.value.deposit)
  const paymentCycle = parsePositiveInteger(form.value.paymentCycle)
  const leaseMonths = parsePositiveInteger(form.value.leaseMonths)
  const waterBase = parseNonNegativeNumber(form.value.waterBase)
  const electricBase = parseNonNegativeNumber(form.value.electricBase)
  const collectionAmount = parsePositiveAmount(checkInChargeAmount.value)

  if (!tenant) return uni.showToast({ title: '请填写租客姓名', icon: 'none' })
  if (!isValidMainlandPhone(phone)) return uni.showToast({ title: '请输入正确手机号', icon: 'none' })
  if (!rent || deposit === null || !paymentCycle) return uni.showToast({ title: '请完善租金、押金和周期', icon: 'none' })
  const leaseStart = normalizeDateInput(form.value.leaseStart)
  if (!leaseStart) return uni.showToast({ title: '请输入有效租期开始日期', icon: 'none' })
  form.value.leaseStart = leaseStart
  if (!leaseMonths) return uni.showToast({ title: '请填写租期月数', icon: 'none' })

  const changed = applyLocalCheckIn({
    tenant,
    phone,
    rent,
    deposit,
    paymentCycle,
    leaseMonths,
    waterBase,
    electricBase,
    collectionAmount,
  })
  if (!changed) return
  uni.showToast({ title: '已办理入住', icon: 'success' })
  emit('checked-in')

  if (canUseCloudBackup()) {
    const attachmentIds = [...new Set([
      ...attachments.value.idCard.map((file) => file?.id),
      ...attachments.value.contract.map((file) => file?.id),
      checkInReceiptFile.value?.id,
      depositReceiptFile.value?.id,
    ].filter(Boolean))]
    enqueueSyncTask({
      type: 'room.checkin',
      propertyId: props.propertyId,
      blockId: props.blockId,
      roomId: props.roomId,
      payload: {
      tenantName: tenant,
      phone,
      idCardNo: '',
      rentAmount: rent,
      depositAmount: deposit,
      paymentCycleMonths: paymentCycle,
      leaseStartDate: form.value.leaseStart,
      leaseMonths,
      waterPrice: null,
      electricPrice: null,
      gasPrice: null,
      heatingPrice: null,
      waterChargeMode: form.value.waterChargeMode === 'included' ? 'included' : 'separate',
      electricChargeMode: form.value.electricChargeMode === 'included' ? 'included' : 'separate',
      gasChargeMode: form.value.gasChargeMode === 'included' ? 'included' : 'separate',
      heatingChargeMode: form.value.heatingChargeMode === 'included' ? 'included' : 'separate',
      lastWaterReading: waterBase === null ? null : waterBase,
      lastElectricReading: electricBase === null ? null : electricBase,
      lastGasReading: null,
      attachmentIds,
      },
    })
  }
}
</script>

<style scoped>
.sheet-font-boost .text-2xs{font-size: 22rpx!important}.sheet-font-boost .text-xs{font-size: 26rpx!important}.sheet-font-boost .text-sm{font-size: 30rpx!important}.sheet-font-boost .text-base{font-size: 34rpx!important}.sheet-font-boost .text-lg{font-size: 38rpx!important}.sheet-font-boost .tenant-inline-input{font-size: 30rpx}.sheet-font-boost .detail-side-button-text{font-size: 26rpx}.sheet-font-boost .checkin-input{font-size: 30rpx}.sheet-font-boost .checkin-cycle-input,.sheet-font-boost .cycle-option-button{font-size: 26rpx}.sheet-font-boost .compact-field-label{font-size: 26rpx}.sheet-font-boost .compact-inline-note-label{font-size: 22rpx}.sheet-font-boost .compact-inline-note-value{font-size: 24rpx}.sheet-font-boost .utility-config-name{font-size: 30rpx}.sheet-font-boost .utility-mode-button,.sheet-font-boost .utility-inline-base-disabled{font-size: 26rpx}.sheet-font-boost .utility-inline-base-input{font-size: 30rpx}.sheet-font-boost .checkin-charge-button{font-size: 26rpx}
.tenant-inline-input{width:100%;min-height:36rpx;padding:4rpx 0;background:transparent;border:0;box-sizing:border-box;line-height:1.4;color:#0f172a;font-weight:500}.tenant-inline-input::placeholder,.checkin-input::placeholder{color:#94a3b8;font-weight:400}
.detail-side-button{min-width:112rpx;padding:16rpx 18rpx;border-radius:14rpx;border-width:1rpx;text-align:center;flex-shrink:0}.detail-side-button-text{line-height:1.1;font-weight:600}
.checkin-input{width:100%;height:68rpx;padding:0 20rpx;border-radius:18rpx;border:1rpx solid rgba(226,232,240,.95);background:#fff;box-sizing:border-box;line-height:68rpx;color:#0f172a;font-weight:500}
.checkin-cycle-input-wrap{position:relative;width:128rpx;height:60rpx}.checkin-cycle-input{width:100%;height:60rpx;padding:0 46rpx 0 16rpx;border-radius:16rpx;border:1rpx solid rgba(226,232,240,.95);background:#fff;box-sizing:border-box;line-height:60rpx;color:#0f172a;font-weight:500}.checkin-cycle-unit{position:absolute;right:14rpx;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:20rpx;line-height:1;pointer-events:none}
.compact-field-label{font-size: 24rpx;font-weight:600;color:#334155}.compact-inline-note{display:flex;align-items:center;gap:12rpx;min-width:0}.compact-inline-note-label{color:#94a3b8;font-weight:500;white-space:nowrap}.compact-inline-note-value{color:#334155;font-weight:500;min-width:0;line-height:1.3}
.cycle-option-button{min-width:92rpx;padding:14rpx 18rpx;border-radius:16rpx;border:1rpx solid rgba(226,232,240,.95);font-weight:600;line-height:1}.cycle-option-default{background:#fff;color:#475569}.cycle-option-active{background:#0f172a;color:#fff;border-color:#0f172a}
.utility-config-row{display:flex;align-items:center;justify-content:space-between;gap:16rpx;flex-wrap:nowrap}.utility-config-name{min-width:72rpx;font-weight:500;color:#334155}.utility-config-inline{display:flex;align-items:center;gap:12rpx;min-width:0}
.utility-inline-base-input{width:168rpx;height:60rpx;margin-top:0;padding:0 14rpx;border-radius:16rpx;line-height:60rpx}.utility-inline-base-disabled{width:168rpx;height:60rpx;padding:0 14rpx;border-radius:16rpx;background:#f8fafc;border:1rpx solid rgba(226,232,240,.95);color:#94a3b8;line-height:60rpx;text-align:center;box-sizing:border-box}
.utility-mode-button{min-width:124rpx;padding:12rpx 16rpx;border-radius:16rpx;border:1rpx solid rgba(226,232,240,.95);font-weight:600;line-height:1}.utility-mode-default{background:#fff;color:#475569}.utility-mode-active{background:#eff6ff;color:#2563eb;border-color:rgba(191,219,254,.95)}
.checkin-primary-action{background:linear-gradient(135deg,#34d399,#4ade80);box-shadow:0 12rpx 24rpx rgba(52,211,153,.18)}.date-step-button{min-width:120rpx;height:64rpx;padding:0 18rpx;border-radius:18rpx;background:#fff;border:1rpx solid rgba(226,232,240,.95);font-size: 22rpx;font-weight:700;color:#334155}.date-chip{height:60rpx;border-radius:16rpx;background:#f8fafc;border:1rpx solid rgba(226,232,240,.95);font-size: 22rpx;font-weight:700;color:#475569}
.checkin-charge-button{min-width:96rpx;padding:14rpx 18rpx;border-radius:12rpx;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;font-weight:700;line-height:1;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 12rpx 22rpx rgba(37,99,235,.18)}
</style>
