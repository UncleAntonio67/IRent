<template>
  <view class="min-h-screen bg-slate-900-45 flex items-end justify-center" @click="closeSelf">
    <view class="w-full max-w-md drawer-page-panel flex flex-col bg-slate-50 rounded-t-3xl shadow-2xl relative overflow-hidden" @click.stop>
      <view class="bg-white-80 border-b px-5 pt-3 pb-3 border-slate-200-60 relative shrink-0">
        <view class="flex justify-center">
          <view class="w-12 h-1_5 rounded-full bg-slate-200 mt-1"></view>
        </view>
        <view class="flex items-center justify-between gap-3">
          <view class="flex items-center gap-3 min-w-0">
            <button class="nav-icon-button tap-scale" @click="closeSelf"><view class="icon-close"><view class="icon-close-line"></view><view class="icon-close-line icon-close-line-second"></view></view></button>
            <view class="min-w-0">
              <view class="font-black text-slate-900 text-base truncate">办理入住</view>
              <view class="text-xs text-slate-400 font-medium mt-0_5 truncate">
                {{ property?.name || '' }}<text v-if="property" class="mx-1 text-slate-200">|</text>{{ block?.name || '' }}
              </view>
            </view>
          </view>
          <view v-if="room" class="text-2xs font-bold px-3 py-1 rounded-full chip-soft text-slate-600">
            {{ room.roomNo }} 空置
          </view>
        </view>

        <view class="mt-4">
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
        <view v-if="!room" class="p-5">
          <view class="p-5 rounded-2xl surface-card">
            <view class="text-sm text-slate-600 font-medium leading-relaxed">房间不存在或参数缺失。</view>
          </view>
        </view>

        <view v-else-if="room.status !== 'empty'" class="p-5 stack-4">
          <view class="p-5 rounded-2xl bg-white border border-slate-200-60 shadow-soft">
            <view class="font-black text-slate-800">当前房间已入住</view>
            <view class="text-sm text-slate-600 font-medium leading-relaxed mt-2">
              该房间当前不是空置状态，不能重复办理入住。
            </view>
          </view>
          <button class="w-full py-4 rounded-xl btn-blue font-bold tap-scale" @click="goRoomDetail">
            去房间详情
          </button>
        </view>

        <view v-else class="p-5 stack-4">
          <view v-if="tab === 'history'" class="stack-4">
            <view class="p-5 rounded-2xl surface-card">
              <view class="font-black text-slate-800">历史入住情况</view>
              <view class="text-xs text-slate-400 font-medium mt-1">按时间轴组织，便于快速追溯。</view>
              <view class="mt-4">
                <OccupancyTimeline :occupancies="room.occupancies || []" />
              </view>
            </view>
            <view class="h-24"></view>
          </view>

          <view v-else class="stack-4">
            <view class="p-5 rounded-2xl surface-card">
              <view class="font-black text-slate-800">租金与周期</view>
              <view class="grid grid-cols-2 gap-3 mt-4">
                <view class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <view class="text-xs text-slate-500 font-bold">租金(每期)</view>
                  <input
                    v-model="form.rent"
                    type="number"
                    class="mt-2 w-full px-3 py-3 bg-white border border-slate-200 rounded-xl font-mono"
                    placeholder="例如：3200"
                  />
                </view>
                <view class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <view class="text-xs text-slate-500 font-bold">押金</view>
                  <input
                    v-model="form.deposit"
                    type="number"
                    class="mt-2 w-full px-3 py-3 bg-white border border-slate-200 rounded-xl font-mono"
                    placeholder="例如：6400"
                  />
                </view>
              </view>

              <view class="mt-4">
                <view class="text-xs text-slate-500 font-bold">付款周期(可配置)</view>
                <view class="flex gap-2 mt-2 flex-wrap">
                  <button
                    v-for="opt in cycleOptions"
                    :key="opt.value"
                    class="px-3 py-2 rounded-xl text-xs font-bold border tap-scale"
                    :class="Number(form.paymentCycle) === opt.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'"
                    @click="form.paymentCycle = String(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                  <view class="flex items-center gap-2">
                    <view class="text-xs text-slate-400 font-bold">自定义几个月</view>
                    <input
                      v-model="form.paymentCycle"
                      type="number"
                      class="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                      placeholder="例如：2"
                    />
                  </view>
                </view>
              </view>

              <view class="grid grid-cols-2 gap-3 mt-4">
                <view class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <view class="text-xs text-slate-500 font-bold">租期开始</view>
                  <picker mode="date" :value="form.leaseStart" @change="(e) => (form.leaseStart = e.detail.value)">
                    <view class="mt-2 px-3 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs">
                      {{ form.leaseStart || '选择日期' }}
                    </view>
                  </picker>
                </view>
                <view class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <view class="text-xs text-slate-500 font-bold">租期结束</view>
                  <picker mode="date" :value="form.leaseEnd" @change="(e) => (form.leaseEnd = e.detail.value)">
                    <view class="mt-2 px-3 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs">
                      {{ form.leaseEnd || '选择日期' }}
                    </view>
                  </picker>
                </view>
              </view>
            </view>

            <view class="p-5 rounded-2xl surface-card">
              <view class="font-black text-slate-800">租客信息</view>
              <view class="grid grid-cols-2 gap-3 mt-4">
                <view class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <view class="text-xs text-slate-500 font-bold">姓名</view>
                  <input v-model="form.tenant" type="text" class="mt-2 w-full px-3 py-3 bg-white border border-slate-200 rounded-xl font-medium" placeholder="例如：王先生" />
                </view>
                <view class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <view class="text-xs text-slate-500 font-bold">手机号</view>
                  <input v-model="form.phone" type="text" class="mt-2 w-full px-3 py-3 bg-white border border-slate-200 rounded-xl font-mono" placeholder="例如：13800000000" />
                </view>
              </view>
              <view class="p-4 rounded-2xl bg-slate-50 border border-slate-200 mt-3">
                <view class="text-xs text-slate-500 font-bold">身份证号</view>
                <input v-model="form.idCard" type="text" class="mt-2 w-full px-3 py-3 bg-white border border-slate-200 rounded-xl font-mono" placeholder="例如：4403xxxxxxxxxxxxxx" />
              </view>
            </view>

            <view class="p-5 rounded-2xl bg-white border border-slate-200-60 shadow-soft">
              <view class="font-black text-slate-800">强制双证</view>
              <view class="text-xs text-slate-400 font-medium mt-1">身份证与合同都需要上传后，才能确认入住。</view>
              <view class="grid grid-cols-2 gap-3 mt-4">
                <button
                  class="p-4 rounded-2xl border tap-scale text-left"
                  :class="attachments.idCard ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'"
                  @click="pickAttachment('idCard')"
                >
                  <view class="text-xs font-bold" :class="attachments.idCard ? 'text-emerald-700' : 'text-rose-700'">身份证照片</view>
                  <view class="text-2xs font-medium mt-2" :class="attachments.idCard ? 'text-emerald-600' : 'text-rose-600'">
                    {{ attachments.idCard ? '已上传(模拟)' : '点击上传' }}
                  </view>
                </button>
                <button
                  class="p-4 rounded-2xl border tap-scale text-left"
                  :class="attachments.contract ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'"
                  @click="pickAttachment('contract')"
                >
                  <view class="text-xs font-bold" :class="attachments.contract ? 'text-emerald-700' : 'text-rose-700'">电子合同</view>
                  <view class="text-2xs font-medium mt-2" :class="attachments.contract ? 'text-emerald-600' : 'text-rose-600'">
                    {{ attachments.contract ? '已上传(模拟)' : '点击上传' }}
                  </view>
                </button>
              </view>
            </view>

            <view class="p-5 rounded-2xl bg-slate-900 text-white">
              <view class="text-xs text-slate-300 font-bold">收款提示</view>
              <view class="text-sm font-medium leading-relaxed mt-2 text-slate-100">
                这里先模拟“确认收款并入住”，后续接入账单引擎后，会按租期与周期生成全部分期账单。
              </view>
            </view>

            <view class="h-24"></view>
          </view>
        </view>
      </scroll-view>

      <view v-if="room && room.status === 'empty' && tab === 'current'" class="absolute inset-x-0 bottom-0 bg-white border-t border-slate-200-60">
        <view class="px-5 py-3 flex items-center gap-2">
          <button class="flex-1 py-4 rounded-xl btn-soft text-slate-700 font-bold tap-scale" @click="resetForm">
            重置
          </button>
          <button class="flex-1 py-4 rounded-xl btn-emerald font-bold tap-scale" @click="confirmCheckIn">
            确认收款并入住
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { cloneProperties, findBlock, findProperty, findRoomWithFloor, generatePaymentSchedule, setProperties } from '../../data/rentStore'
import OccupancyTimeline from '../../components/OccupancyTimeline.vue'
import { safeNavigateBack, safeRedirectTo, safeSwitchTab } from '../../utils/navigation'

const headerTopPadding = ref(44)
const propertyId = ref('')
const blockId = ref('')
const roomId = ref('')
const tab = ref('current')

const property = computed(() => (propertyId.value ? findProperty(propertyId.value) : null))
const block = computed(() => (propertyId.value && blockId.value ? findBlock(propertyId.value, blockId.value) : null))
const roomWithFloor = computed(() =>
  propertyId.value && blockId.value && roomId.value ? findRoomWithFloor(propertyId.value, blockId.value, roomId.value) : null
)
const room = computed(() => roomWithFloor.value?.room || null)

const cycleOptions = [
  { value: 1, label: '月付' },
  { value: 3, label: '季付' },
  { value: 6, label: '半年付' },
  { value: 12, label: '年付' },
]

const form = ref({
  rent: '',
  deposit: '',
  paymentCycle: '3',
  leaseStart: '',
  leaseEnd: '',
  tenant: '',
  phone: '',
  idCard: '',
})

const attachments = ref({ idCard: null, contract: null })

onLoad((query) => {
  try {
    const sys = uni.getSystemInfoSync()
    headerTopPadding.value = Math.max(18, Math.min(24, (sys.statusBarHeight || 20)))
  } catch {
    headerTopPadding.value = 44
  }

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
    leaseStart: '',
    leaseEnd: '',
    tenant: '',
    phone: '',
    idCard: '',
  }
  attachments.value = { idCard: null, contract: null }
  uni.showToast({ title: '已重置', icon: 'none' })
}

function pickAttachment(type) {
  if (type === 'idCard') attachments.value.idCard = buildAttachmentFile('idCard')
  if (type === 'contract') attachments.value.contract = buildAttachmentFile('contract')
  uni.showToast({ title: '已上传(模拟)', icon: 'none' })
}

function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildAttachmentFile(type) {
  const now = todayStr()
  if (type === 'idCard') {
    return {
      name: `${form.value.tenant.trim() || '租客'}_身份证.jpg`,
      uploadedAt: now,
      source: 'mock',
      previewText: '身份证正反面影像（模拟）',
    }
  }
  return {
    name: `${room.value?.roomNo || '房间'}_电子合同.pdf`,
    uploadedAt: now,
    source: 'mock',
    previewText: '已签署租赁合同（模拟）',
  }
}

function confirmCheckIn() {
  if (!room.value) return
  if (!form.value.tenant.trim()) {
    uni.showToast({ title: '请填写租客姓名', icon: 'none' })
    return
  }

  const rent = Number(form.value.rent)
  const deposit = Number(form.value.deposit)
  const paymentCycle = Number(form.value.paymentCycle)
  if (!Number.isFinite(rent) || rent <= 0 || !Number.isFinite(deposit) || deposit < 0 || !Number.isFinite(paymentCycle) || paymentCycle <= 0) {
    uni.showToast({ title: '请完善租金、押金和周期', icon: 'none' })
    return
  }
  if (!attachments.value.idCard || !attachments.value.contract) {
    uni.showToast({ title: '请先上传身份证和合同', icon: 'none' })
    return
  }

  const next = cloneProperties()
  const p = next.find((pp) => pp.id === propertyId.value)
  const b = p?.blocks.find((bb) => bb.id === blockId.value)
  if (!p || !b) return

  let hit = null
  for (const f of b.floors) {
    const r = f.rooms.find((rr) => rr.id === roomId.value)
    if (r) {
      hit = r
      break
    }
  }
  if (!hit) return

  const now = todayStr()
  const nowDate = now.slice(0, 10)

  const lastIdle = (hit.occupancies || []).find((o) => o.kind === 'idle' && (!o.endDate || o.endDate === '') && o.status === 'idle')
  if (lastIdle) lastIdle.endDate = nowDate

  const occId = `oc_${Date.now()}`
  hit.occupancies = Array.isArray(hit.occupancies) ? hit.occupancies : []
  hit.occupancies.unshift({
    id: occId,
    kind: 'lease',
    status: 'active',
    tenant: form.value.tenant.trim(),
    phone: form.value.phone.trim(),
    idCard: form.value.idCard.trim(),
    startDate: form.value.leaseStart || nowDate,
    endDate: form.value.leaseEnd || '',
    rent,
    deposit,
    paymentCycle,
    remark: '办理入住(模拟)',
    archive: null,
  })
  hit.activeOccupancyId = occId

  const leaseStart = form.value.leaseStart || nowDate
  let leaseEnd = form.value.leaseEnd || ''
  if (!leaseEnd) {
    const tmp = new Date(leaseStart)
    if (!Number.isNaN(tmp.getTime())) {
      tmp.setFullYear(tmp.getFullYear() + 1)
      tmp.setDate(tmp.getDate() - 1)
      const pad = (n) => String(n).padStart(2, '0')
      leaseEnd = `${tmp.getFullYear()}-${pad(tmp.getMonth() + 1)}-${pad(tmp.getDate())}`
    }
  }

  hit.paymentSchedule = generatePaymentSchedule({
    startDate: leaseStart,
    endDate: leaseEnd,
    cycleMonths: paymentCycle,
    rentPerCycle: rent,
  })

  if (hit.paymentSchedule.length > 0) {
    hit.paymentSchedule[0].paidAmount = hit.paymentSchedule[0].expectedAmount
    hit.paymentSchedule[0].status = 'paid'
    hit.paymentSchedule[0].payDate = now
    hit.paymentSchedule[0].receiptPic = true
  }

  hit.tenant = form.value.tenant.trim()
  hit.phone = form.value.phone.trim()
  hit.idCard = form.value.idCard.trim()
  hit.rent = rent
  hit.deposit = deposit
  hit.paymentCycle = paymentCycle
  hit.leaseStart = leaseStart
  hit.leaseEnd = leaseEnd
  hit.hasIdCardPic = true
  hit.hasContract = true
  hit.attachmentFiles = {
    idCard: attachments.value.idCard,
    contract: attachments.value.contract,
  }
  hit.status = 'rented'

  const amount = Number((rent * paymentCycle).toFixed(2))
  hit.history.unshift({
    id: `h_${Date.now()}`,
    type: 'checkin',
    date: now,
    remark: `办理入住并确认收款：${hit.tenant}，首期 ¥${amount}`,
  })

  setProperties(next)
  uni.showToast({ title: '已入住(模拟)', icon: 'success' })
  safeRedirectTo(`/pages/room/detail?propertyId=${propertyId.value}&blockId=${blockId.value}&roomId=${roomId.value}`)
}
</script>

