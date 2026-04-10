<template>
  <view class="h-screen bg-slate-50 text-slate-800">
    <view class="mx-auto max-w-md h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-hidden">
      <view class="bg-white-80 border-b px-5 pb-3 border-slate-200-60 relative shrink-0 sticky-header z-20 shadow-soft" :style="{ paddingTop: headerTopPadding + 'px' }">
        <view class="flex items-center justify-between">
          <view class="font-black text-slate-900 text-base">{{ billUi.title }}</view>
          <view class="chip-soft px-3 py-1_5 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1_5">
            <view class="w-4 h-4 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-3xs font-black">年</view>
            {{ billUi.range }}
          </view>
        </view>

        <view class="mt-4 p-6 rounded-2xl bills-hero text-white relative overflow-hidden shadow-lg">
          <view class="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white-20"></view>
          <view class="absolute -right-2 -bottom-2 w-28 h-28 rounded-full bg-white-20"></view>
          <view class="absolute -right-6 -bottom-10 text-8xl font-black opacity-10 pointer-events-none select-none">账</view>

          <view class="text-blue-100 text-xs font-medium mb-2">{{ billUi.totalPaid }}</view>
          <view class="text-4xl font-black font-mono tracking-tight">¥{{ fmtMoney(billStats.paidTotal) }}</view>

          <view class="grid grid-cols-2 gap-4 border-t border-white-20 pt-4 mt-6">
            <view>
              <view class="text-blue-100 text-2xs font-medium mb-1">{{ billUi.breakdown }}</view>
              <view class="font-mono font-bold text-sm">
                ¥{{ fmtMoney(billStats.rentPaid) }}
                <text class="mx-1 opacity-70">/</text>
                ¥{{ fmtMoney(billStats.utilsPaid) }}
                <text class="mx-1 opacity-70">/</text>
                ¥{{ fmtMoney(billStats.customPaid) }}
              </view>
            </view>
            <view class="text-right">
              <view class="text-rose-100 text-2xs font-medium mb-1">{{ billUi.pending }}</view>
              <view class="font-mono font-black text-rose-100 text-base">¥{{ fmtMoney(billStats.pendingTotal) }}</view>
            </view>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="page-scroll" :scroll-with-animation="true">
        <view class="p-5 stack-5" style="padding-bottom: 32rpx;">
          <view class="flex items-center justify-between">
            <view class="flex items-center gap-2 min-w-0">
              <view class="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-sm shrink-0">账</view>
              <view class="min-w-0">
                <view class="font-black text-slate-800 text-base truncate">账单与杂费流水</view>
                <view class="text-2xs text-slate-400 font-medium mt-0_5">按待收、已收和费用类型快速查看</view>
              </view>
            </view>
          </view>

          <view class="stack-3">
            <view class="p-1 surface-muted rounded-2xl flex gap-1">
              <button
                class="flex-1 py-2_5 rounded-xl text-xs font-black tap-scale"
                :class="billFilter === 'pending' ? 'bg-white text-rose-600 shadow-soft' : 'bg-transparent text-slate-500'"
                @click="billFilter = 'pending'"
              >
                待收账单
              </button>
              <button
                class="flex-1 py-2_5 rounded-xl text-xs font-black tap-scale"
                :class="billFilter === 'paid' ? 'bg-white text-emerald-600 shadow-soft' : 'bg-transparent text-slate-500'"
                @click="billFilter = 'paid'"
              >
                已收流水
              </button>
            </view>

            <view class="grid grid-cols-3 gap-2">
              <view class="p-3 rounded-2xl surface-card">
                <view class="text-2xs text-slate-400 font-bold">待收笔数</view>
                <view class="text-lg font-black font-mono text-slate-900 mt-1">{{ pendingCount }}</view>
              </view>
              <view class="p-3 rounded-2xl surface-card">
                <view class="text-2xs text-slate-400 font-bold">欠费笔数</view>
                <view class="text-lg font-black font-mono text-rose-600 mt-1">{{ overdueCount }}</view>
              </view>
              <view class="p-3 rounded-2xl surface-card">
                <view class="text-2xs text-slate-400 font-bold">已收笔数</view>
                <view class="text-lg font-black font-mono text-emerald-600 mt-1">{{ paidCount }}</view>
              </view>
            </view>
          </view>

          <scroll-view scroll-x show-scrollbar="false">
            <view class="flex gap-2 pb-1">
              <button
                class="whitespace-nowrap px-3 py-2_5 rounded-xl text-xs font-bold border tap-scale"
                :class="typeTab === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'"
                @click="typeTab = 'all'"
              >
                全部类型
              </button>
              <button
                class="whitespace-nowrap px-3 py-2_5 rounded-xl text-xs font-bold border tap-scale"
                :class="typeTab === 'rent' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'"
                @click="typeTab = 'rent'"
              >
                房租
              </button>
              <button
                class="whitespace-nowrap px-3 py-2_5 rounded-xl text-xs font-bold border tap-scale"
                :class="typeTab === 'utilities' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'"
                @click="typeTab = 'utilities'"
              >
                水电杂费
              </button>
              <button
                class="whitespace-nowrap px-3 py-2_5 rounded-xl text-xs font-bold border tap-scale"
                :class="typeTab === 'custom' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'"
                @click="typeTab = 'custom'"
              >
                灵活收费
              </button>
            </view>
          </scroll-view>

          <view class="p-4 rounded-2xl surface-card">
            <view class="text-xs text-slate-500 font-bold">搜索账单</view>
            <view class="mt-2 relative">
              <view class="absolute left-3 top-3 w-7 h-7 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xs font-black">搜</view>
              <input v-model="search" type="text" class="w-full pl-12 pr-4 py-3 rounded-xl input-soft font-medium" placeholder="按房号或租客姓名查找" />
            </view>
          </view>

          <view v-if="items.length === 0" class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-400 font-medium text-sm">
            <view class="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 font-black text-lg mb-3">账</view>
            暂无匹配记录
          </view>

          <view v-else class="stack-3">
            <view
              v-for="item in items"
              :key="item.key"
              class="p-4 rounded-2xl bg-white border border-slate-200-60 shadow-soft flex flex-col gap-3"
              :class="
                billFilter === 'pending'
                  ? item.status === 'overdue'
                    ? 'border-l-4 border-l-rose-500'
                    : item.status === 'due_soon'
                      ? 'border-l-4 border-l-amber-400'
                      : 'border-l-4 border-l-slate-200'
                  : ''
              "
            >
              <view class="flex justify-between items-center border-b border-slate-100 pb-3 gap-3">
                <view class="min-w-0">
                  <view class="flex items-center gap-2 min-w-0">
                    <view class="font-black text-slate-900 truncate">{{ item.roomNo }}</view>
                    <view class="text-xs font-bold text-slate-500 truncate">{{ item.tenant || '未录入租客' }}</view>
                  </view>
                  <view class="text-2xs text-slate-400 font-medium mt-1 truncate">{{ item.title }}</view>
                </view>
                <view class="flex items-center gap-2 shrink-0">
                  <view class="text-3xs font-black px-2 py-1 rounded-full border" :class="typeTag(item.kind)">
                    {{ typeText(item.kind) }}
                  </view>
                  <view class="text-3xs font-black px-2 py-1 rounded-full border" :class="statusTag(item.status)">
                    {{ statusText(item.status) }}
                  </view>
                </view>
              </view>

              <view class="flex justify-between items-end gap-3">
                <view class="min-w-0 flex-1">
                  <view class="text-2xs text-slate-400 font-mono truncate">到期日 {{ fmtDate(item.dueDate) }}</view>
                  <view v-if="item.status === 'paid' && item.payDate" class="text-2xs text-slate-400 font-mono truncate mt-1">记收时间 {{ item.payDate }}</view>
                  <view
                    v-if="item.status === 'paid' && item.receiptPic"
                    class="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-3xs font-black border border-blue-200 tap-scale"
                    @click.stop="openReceipt(item)"
                  >
                    <text>凭证</text>
                    <text class="text-blue-400">查看</text>
                  </view>
                </view>

                <view class="text-right flex flex-col items-end gap-2 shrink-0">
                  <view class="font-black font-mono text-lg leading-none" :class="item.status === 'paid' ? 'text-emerald-600' : 'text-slate-900'">
                    {{ item.status === 'paid' ? '+ ' : '' }}¥{{ fmtMoney(item.amount) }}
                  </view>
                  <view class="flex gap-2">
                    <button class="text-2xs font-black px-3 py-2 rounded-xl btn-slate tap-scale" @click="goRoom(item)">
                      房间
                    </button>
                    <button
                      class="text-2xs font-black px-3 py-2 rounded-xl tap-scale"
                      :class="item.status === 'paid' ? 'btn-soft text-slate-500' : 'btn-blue text-white'"
                      :disabled="item.status === 'paid'"
                      @click="openEntry(item)"
                    >
                      {{ item.status === 'paid' ? '已收' : '记收' }}
                    </button>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="h-4"></view>
        </view>
      </scroll-view>

      <BottomDrawer :open="drawerOpen" title="记账收款" subtitle="将当前账单标记为已收，可选上传凭证截图（模拟）" @close="closeEntry">
        <view v-if="selected" class="stack-3">
          <view class="p-4 rounded-2xl surface-muted">
            <view class="text-xs text-slate-500 font-bold">当前条目</view>
            <view class="text-base font-black text-slate-900 mt-2">{{ selected.roomNo }} {{ selected.title }}</view>
            <view class="text-xs text-slate-500 font-mono mt-2">
              金额 ¥{{ fmtMoney(selected.amount) }}
              <text class="mx-2 text-slate-200">|</text>
              到期 {{ fmtDate(selected.dueDate) }}
            </view>
          </view>

          <view class="p-4 rounded-2xl surface-card">
            <view class="flex items-center justify-between gap-3">
              <view class="text-xs text-slate-500 font-bold">支付凭证（可选）</view>
              <button class="px-3 py-2 rounded-xl btn-slate text-xs font-bold tap-scale" @click="toggleReceipt">
                {{ receiptPicked ? '已选择' : '选择截图' }}
              </button>
            </view>
            <view class="text-xs text-slate-400 font-medium mt-2">
              {{ receiptPicked ? '会把 receiptPic 标记为 true，模拟已上传凭证。' : '不上传截图也可以直接记收。' }}
            </view>
          </view>
        </view>

        <template #footer>
          <button class="w-full py-4 rounded-xl btn-emerald font-bold tap-scale" :disabled="!selected" @click="markSelectedPaid">
            记为已收
          </button>
        </template>
      </BottomDrawer>

      <BottomDrawer :open="receiptOpen" title="支付凭证" subtitle="这里展示凭证截图留存位置（模拟）" @close="closeReceipt">
        <view v-if="receiptItem" class="stack-3">
          <view class="p-4 rounded-2xl surface-muted">
            <view class="text-xs text-slate-500 font-bold">账单信息</view>
            <view class="text-base font-black text-slate-900 mt-2">{{ receiptItem.roomNo }} {{ receiptItem.title }}</view>
            <view class="text-xs text-slate-500 font-mono mt-2">
              金额 ¥{{ fmtMoney(receiptItem.amount) }}
              <text class="mx-2 text-slate-200">|</text>
              记收 {{ receiptItem.payDate || '-' }}
            </view>
          </view>

          <view class="p-4 rounded-2xl surface-card">
            <view class="text-xs text-slate-500 font-bold">凭证截图</view>
            <view class="mt-3 h-44 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold">
              截图预览占位
            </view>
            <view class="text-2xs text-slate-400 font-medium mt-3">
              demo 版本当前只保留“是否留存”的状态。后续接入 Cloudflare R2 后可以展示真实图片。
            </view>
          </view>
        </view>
      </BottomDrawer>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BottomDrawer from '../../components/BottomDrawer.vue'
import { properties, cloneProperties, setProperties } from '../../data/rentStore'
import { safeNavigateTo } from '../../utils/navigation'

const billUi = {
  title: '年度报表追踪',
  range: '全年',
  totalPaid: '总实收金额 (元)',
  breakdown: '已收房租 / 水电 / 灵活',
  pending: '当前待收合计',
}

const headerTopPadding = ref(44)
const billFilter = ref('pending')
const typeTab = ref('all')
const search = ref('')

const drawerOpen = ref(false)
const selected = ref(null)
const receiptPicked = ref(false)

const receiptOpen = ref(false)
const receiptItem = ref(null)

onLoad(() => {
  try {
    const sys = uni.getSystemInfoSync()
    headerTopPadding.value = Math.max(44, (sys.statusBarHeight || 20) + 12)
  } catch {
    headerTopPadding.value = 44
  }
})

function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function isoToday() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fmtDate(iso) {
  const s = String(iso || '').trim()
  if (!s) return '-'
  return s.replace(/-/g, '.')
}

function fmtMoney(n) {
  const v = Number(n || 0)
  if (!Number.isFinite(v)) return '0.00'
  return v.toFixed(2)
}

function deriveStatusFromDueDate(dueDate, rawPaid) {
  if (rawPaid) return 'paid'
  const due = String(dueDate || '').trim()
  if (!due) return 'unpaid'
  const today = isoToday()
  if (due < today) return 'overdue'
  const diffDays = Math.floor((new Date(due).getTime() - new Date(today).getTime()) / (24 * 60 * 60 * 1000))
  if (diffDays <= 7) return 'due_soon'
  return 'unpaid'
}

const entries = computed(() => {
  const out = []
  for (const p of properties.value) {
    for (const b of p.blocks || []) {
      for (const f of b.floors || []) {
        for (const r of f.rooms || []) {
          for (const term of r.paymentSchedule || []) {
            const isPaid = term.status === 'paid' && Number(term.paidAmount || 0) >= Number(term.expectedAmount || 0)
            out.push({
              key: `rent_${p.id}_${b.id}_${r.id}_${term.id}`,
              kind: 'rent',
              propertyId: p.id,
              blockId: b.id,
              roomId: r.id,
              termId: term.id,
              roomNo: r.roomNo,
              tenant: r.tenant,
              title: `房租 第${term.term}期`,
              amount: Number(term.expectedAmount || 0) || 0,
              paidAmount: Number(term.paidAmount || 0) || 0,
              dueDate: term.dueDate,
              payDate: term.payDate || '',
              receiptPic: Boolean(term.receiptPic),
              status: deriveStatusFromDueDate(term.dueDate, isPaid),
            })
          }

          for (const bill of r.bills || []) {
            if (bill.type === 'rent') continue
            out.push({
              key: `bill_${p.id}_${b.id}_${r.id}_${bill.id}`,
              kind: bill.type || 'custom',
              propertyId: p.id,
              blockId: b.id,
              roomId: r.id,
              billId: bill.id,
              roomNo: r.roomNo,
              tenant: r.tenant,
              title: bill.title || '费用',
              amount: Number(bill.amount || 0) || 0,
              paidAmount: bill.status === 'paid' ? Number(bill.amount || 0) || 0 : 0,
              dueDate: bill.dueDate,
              payDate: bill.payDate || '',
              receiptPic: Boolean(bill.receiptPic),
              status: deriveStatusFromDueDate(bill.dueDate, bill.status === 'paid'),
            })
          }
        }
      }
    }
  }
  return out
})

const billStats = computed(() => {
  const list = entries.value
  const paidTotal = Math.round(list.filter((x) => x.status === 'paid').reduce((s, x) => s + Number(x.amount || 0), 0) * 100) / 100
  const pendingTotal = Math.round(list.filter((x) => x.status !== 'paid').reduce((s, x) => s + Number(x.amount || 0), 0) * 100) / 100
  const rentPaid = Math.round(list.filter((x) => x.kind === 'rent' && x.status === 'paid').reduce((s, x) => s + Number(x.amount || 0), 0) * 100) / 100
  const utilsPaid = Math.round(list.filter((x) => x.kind === 'utilities' && x.status === 'paid').reduce((s, x) => s + Number(x.amount || 0), 0) * 100) / 100
  const customPaid = Math.round(list.filter((x) => x.kind === 'custom' && x.status === 'paid').reduce((s, x) => s + Number(x.amount || 0), 0) * 100) / 100
  return { paidTotal, pendingTotal, rentPaid, utilsPaid, customPaid }
})

const pendingCount = computed(() => entries.value.filter((x) => x.status !== 'paid').length)
const paidCount = computed(() => entries.value.filter((x) => x.status === 'paid').length)
const overdueCount = computed(() => entries.value.filter((x) => x.status === 'overdue').length)

const items = computed(() => {
  let list = entries.value.slice()

  if (typeTab.value !== 'all') list = list.filter((x) => x.kind === typeTab.value)
  if (billFilter.value === 'pending') list = list.filter((x) => x.status !== 'paid')
  if (billFilter.value === 'paid') list = list.filter((x) => x.status === 'paid')

  const q = String(search.value || '').trim().toLowerCase()
  if (q) {
    list = list.filter((x) => String(x.roomNo || '').toLowerCase().includes(q) || String(x.tenant || '').toLowerCase().includes(q))
  }

  list.sort((a, b) => {
    const ap = a.status === 'paid' ? 1 : 0
    const bp = b.status === 'paid' ? 1 : 0
    if (ap !== bp) return ap - bp
    const order = (s) => (s === 'overdue' ? 0 : s === 'due_soon' ? 1 : 2)
    const ao = order(a.status)
    const bo = order(b.status)
    if (ao !== bo) return ao - bo
    const ad = String(a.dueDate || '')
    const bd = String(b.dueDate || '')
    if (ad === bd) return 0
    return ad < bd ? -1 : 1
  })
  return list
})

function typeText(kind) {
  if (kind === 'rent') return '房租'
  if (kind === 'utilities') return '水电'
  return '灵活'
}

function typeTag(kind) {
  if (kind === 'rent') return 'bg-slate-900 text-white border-slate-900'
  if (kind === 'utilities') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

function statusText(status) {
  if (status === 'paid') return '已收'
  if (status === 'overdue') return '欠费'
  if (status === 'due_soon') return '临期'
  return '待收'
}

function statusTag(status) {
  if (status === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'overdue') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (status === 'due_soon') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}

function goRoom(item) {
  safeNavigateTo(`/pages/room/detail?propertyId=${item.propertyId}&blockId=${item.blockId}&roomId=${item.roomId}`)
}

function openEntry(item) {
  selected.value = item
  receiptPicked.value = false
  drawerOpen.value = true
}

function closeEntry() {
  drawerOpen.value = false
  selected.value = null
  receiptPicked.value = false
}

function toggleReceipt() {
  receiptPicked.value = !receiptPicked.value
}

function openReceipt(item) {
  receiptItem.value = item
  receiptOpen.value = true
}

function closeReceipt() {
  receiptOpen.value = false
  receiptItem.value = null
}

function markSelectedPaid() {
  if (!selected.value) return
  const now = todayStr()
  const next = cloneProperties()

  const p = next.find((pp) => pp.id === selected.value.propertyId)
  const b = p?.blocks.find((bb) => bb.id === selected.value.blockId)
  if (!p || !b) return

  let room = null
  for (const f of b.floors) {
    const r = f.rooms.find((rr) => rr.id === selected.value.roomId)
    if (r) {
      room = r
      break
    }
  }
  if (!room) return

  if (selected.value.kind === 'rent') {
    const term = (room.paymentSchedule || []).find((t) => t.id === selected.value.termId)
    if (!term) return
    term.paidAmount = term.expectedAmount
    term.status = 'paid'
    term.payDate = now
    term.receiptPic = Boolean(receiptPicked.value)
    room.history = Array.isArray(room.history) ? room.history : []
    room.history.unshift({ id: `h_${Date.now()}`, type: 'rent_writeoff', date: now, remark: `账务记收: 房租 第${term.term}期 ¥${term.expectedAmount}` })
  } else {
    const bill = (room.bills || []).find((x) => x.id === selected.value.billId)
    if (!bill) return
    bill.status = 'paid'
    bill.payDate = now
    bill.receiptPic = Boolean(receiptPicked.value)
    room.history = Array.isArray(room.history) ? room.history : []
    room.history.unshift({ id: `h_${Date.now()}`, type: 'writeoff', date: now, remark: `账务记收: ${bill.title} ¥${bill.amount}` })
  }

  setProperties(next)
  uni.showToast({ title: '已记为已收', icon: 'success' })
  closeEntry()
}
</script>
