<template>
  <view class="h-screen bg-slate-50 text-slate-800">
    <view class="mx-auto max-w-md h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-hidden">
      <view class="bg-white-80 border-b px-5 pb-3 border-slate-200-60 relative shrink-0 sticky-header z-20 shadow-soft" :style="{ paddingTop: headerTopPadding + 'px' }">
        <view>
          <view class="font-black text-slate-900 text-base">账务流水</view>
          <view class="text-xs text-slate-400 font-medium mt-0_5">按类型、房号和租客快速查询已收记录</view>
        </view>

        <view class="mt-4 p-4 rounded-2xl bills-hero text-white relative overflow-hidden shadow-lg">
          <view class="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-white-20"></view>
          <view class="absolute -right-4 -bottom-8 w-20 h-20 rounded-full bg-white-20"></view>
          <view class="relative z-10">
            <view class="text-blue-100 text-2xs font-medium">累计实收</view>
            <view class="text-3xl font-black font-mono tracking-tight mt-1">¥{{ fmtMoney(billStats.paidTotal) }}</view>
            <view class="flex items-center gap-4 mt-3 pt-3 border-t border-white-20">
              <view class="min-w-0">
                <view class="text-blue-100 text-3xs font-medium">房租</view>
                <view class="font-mono font-black text-xs mt-1">¥{{ fmtMoney(billStats.rentPaid) }}</view>
              </view>
              <view class="min-w-0">
                <view class="text-blue-100 text-3xs font-medium">水电</view>
                <view class="font-mono font-black text-xs mt-1">¥{{ fmtMoney(billStats.utilsPaid) }}</view>
              </view>
              <view class="min-w-0">
                <view class="text-blue-100 text-3xs font-medium">灵活</view>
                <view class="font-mono font-black text-xs mt-1">¥{{ fmtMoney(billStats.customPaid) }}</view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="page-scroll" :scroll-with-animation="true">
        <view class="p-5 stack-3" style="padding-bottom: 32rpx;">
          <view class="p-3 rounded-2xl surface-card stack-2 bills-toolbar">
            <view class="flex items-center justify-between gap-3">
            <view class="bills-section-title">查询条件</view>
              <view class="text-2xs text-slate-400 font-medium">{{ items.length }} 条结果</view>
            </view>

            <view class="bills-search-field bills-search-field-compact">
              <input
                v-model="searchDraft"
                type="text"
                confirm-type="search"
                @confirm="applySearch"
                class="w-full text-xs font-medium text-slate-700 bill-search-input"
                placeholder="搜索房号、租客或流水标题"
                placeholder-class="bill-search-placeholder"
              />
            </view>

            <view class="bills-toolbar-row">
              <view class="relative bills-type-cell">
                <view class="bills-filter-field tap-scale" @click="toggleTypeMenu">
                  <view class="text-xs font-medium text-slate-700 truncate">{{ currentTypeLabel }}</view>
                  <view class="text-xs text-slate-300 font-bold shrink-0">▼</view>
                </view>

                <view v-if="typeMenuOpen" class="bills-type-menu">
                  <view
                    v-for="option in typeOptions"
                    :key="option.value"
                    class="bills-type-option"
                    :class="option.value === typeDraft ? 'bills-type-option-active' : ''"
                    @click="selectType(option.value)"
                  >
                    {{ option.label }}
                  </view>
                </view>
              </view>

              <view class="bills-date-cell bills-filter-field tap-scale" @click="openDateDrawer">
                <view class="text-xs font-medium text-slate-700 truncate">{{ dateSummaryText }}</view>
                <view class="text-xs text-slate-300 font-bold shrink-0">▼</view>
              </view>

              <button class="rounded-xl btn-blue text-xs font-bold tap-scale bills-query-button" @click="applySearch">
                查询
              </button>
            </view>
          </view>

          <view v-if="items.length === 0" class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-400 font-medium text-sm">
            <view class="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 font-black text-lg mb-3">账</view>
            当前筛选下暂无历史流水
          </view>

            <view v-else class="rounded-xl bg-white border border-slate-200-60 shadow-soft overflow-hidden bills-history-card">
              <view class="px-3 py-2 bg-slate-50 border-b border-slate-200-60 flex items-center justify-between text-3xs font-black tracking-wide text-slate-500 uppercase">
                <view class="bills-section-title">历史流水</view>
                <view class="flex items-center gap-3 normal-case tracking-normal">
                  <button class="bills-sort-button" :class="sortKey === 'date' ? 'bills-sort-button-active' : ''" @click="toggleSort('date')">
                    时间{{ sortKey === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : '' }}
                  </button>
                  <button class="bills-sort-button" :class="sortKey === 'amount' ? 'bills-sort-button-active' : ''" @click="toggleSort('amount')">
                    金额{{ sortKey === 'amount' ? (sortOrder === 'desc' ? '↓' : '↑') : '' }}
                  </button>
                </view>
              </view>
            <view
              v-for="item in items"
              :key="item.key"
              class="px-3 py-2_5 flex items-center gap-3"
              :class="item.key !== items[items.length - 1].key ? 'border-b border-slate-100' : ''"
            >
              <view class="min-w-0 w-20 shrink-0">
                <view class="font-black text-slate-900 text-sm truncate">{{ item.roomNo }}</view>
                <view class="text-2xs text-slate-500 truncate mt-0_5">{{ item.tenant || '未录入租客' }}</view>
              </view>

              <view class="min-w-0 flex-1">
                <view class="flex items-center gap-1_5 min-w-0">
                  <view class="text-3xs font-black px-2 py-1 rounded-full border shrink-0" :class="typeTag(item.kind)">{{ typeText(item.kind) }}</view>
                </view>
                <view class="text-xs font-bold text-slate-700 truncate mt-0_5">{{ item.title }}</view>
                <view class="text-3xs text-slate-400 font-mono truncate mt-0_5">{{ fmtDate(item.payDate || item.dueDate) }}</view>
              </view>

              <view class="shrink-0 flex flex-col items-end gap-1">
                <view class="font-black font-mono text-sm leading-none text-emerald-600">+ ¥{{ fmtMoney(item.amount) }}</view>
                <view class="flex items-center gap-2">
                  <button v-if="item.receiptPic" class="text-3xs font-black text-blue-600 tap-scale" @click="openReceipt(item)">
                    凭证
                  </button>
                  <button class="text-3xs font-black text-slate-600 tap-scale" @click="goRoom(item)">
                    房间
                  </button>
                </view>
              </view>
            </view>
            <view class="h-3 bg-white"></view>
          </view>

          <view class="h-4"></view>
        </view>
      </scroll-view>

      <BottomDrawer :open="dateDrawerOpen" title="设置日期范围" subtitle="支持快捷范围和手动输入 YYYY-MM-DD" @close="closeDateDrawer">
        <view class="stack-3">
          <view class="grid grid-cols-4 gap-2">
            <button
              v-for="option in dateQuickOptions"
              :key="option.value"
              class="px-2 py-2 rounded-xl text-xs font-bold border"
              :class="option.value === activeQuickDate ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'"
              @click="applyQuickDate(option.value)"
            >
              {{ option.label }}
            </button>
          </view>

          <view class="stack-2">
            <view class="bills-search-field">
              <view class="text-xs font-bold text-slate-500">开始日期</view>
              <input v-model="startDateDraft" type="text" class="w-full text-xs font-medium text-slate-700 bill-search-input mt-0_5" placeholder="YYYY-MM-DD" placeholder-class="bill-search-placeholder" />
            </view>
            <view class="bills-search-field">
              <view class="text-xs font-bold text-slate-500">结束日期</view>
              <input v-model="endDateDraft" type="text" class="w-full text-xs font-medium text-slate-700 bill-search-input mt-0_5" placeholder="YYYY-MM-DD" placeholder-class="bill-search-placeholder" />
            </view>
          </view>

          <view class="flex items-center gap-2">
            <button class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold" @click="clearDateDraft">清空</button>
            <button class="flex-1 py-3 rounded-xl btn-blue text-sm font-bold" @click="confirmDateDrawer">确定</button>
          </view>
        </view>
      </BottomDrawer>

      <BottomDrawer :open="receiptOpen" title="支付凭证" subtitle="这里展示当前流水对应的凭证截图位置（模拟）" @close="closeReceipt">
        <view v-if="receiptItem" class="stack-3">
          <view class="p-4 rounded-2xl surface-muted">
            <view class="text-xs text-slate-500 font-bold">流水信息</view>
            <view class="text-base font-black text-slate-900 mt-2">{{ receiptItem.roomNo }} {{ receiptItem.title }}</view>
            <view class="text-xs text-slate-500 font-mono mt-2">
              金额 ¥{{ fmtMoney(receiptItem.amount) }}
              <text class="mx-2 text-slate-200">|</text>
              记收 {{ receiptItem.payDate || '-' }}
            </view>
          </view>

          <view class="p-4 rounded-2xl surface-card">
            <view class="text-xs text-slate-500 font-bold">凭证截图</view>
            <view class="mt-3 h-44 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold">截图预览占位</view>
            <view class="text-2xs text-slate-400 font-medium mt-3">目前仅展示留存入口。后续接入 Cloudflare R2 后可展示真实文件。</view>
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
import { properties } from '../../data/rentStore'
import { safeNavigateTo } from '../../utils/navigation'
import { getPageHeaderTopPadding } from '../../utils/layout'

const headerTopPadding = ref(44)
const typeTab = ref('all')
const typeDraft = ref('all')
const startDate = ref('')
const endDate = ref('')
const startDateDraft = ref('')
const endDateDraft = ref('')
const searchDraft = ref('')
const search = ref('')
const sortKey = ref('date')
const sortOrder = ref('desc')
const typeMenuOpen = ref(false)
const dateDrawerOpen = ref(false)
const receiptOpen = ref(false)
const receiptItem = ref(null)

const typeOptions = [
  { label: '全部', value: 'all' },
  { label: '房租', value: 'rent' },
  { label: '水电', value: 'utilities' },
  { label: '灵活', value: 'custom' },
]

const dateQuickOptions = [
  { label: '全部', value: 'all' },
  { label: '近30天', value: 'month' },
  { label: '近90天', value: 'quarter' },
  { label: '本年', value: 'year' },
]

onLoad(() => {
  headerTopPadding.value = getPageHeaderTopPadding(44)
})

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

const entries = computed(() => {
  const out = []
  for (const p of properties.value) {
    for (const b of p.blocks || []) {
      for (const f of b.floors || []) {
        for (const r of f.rooms || []) {
          for (const term of r.paymentSchedule || []) {
            const isPaid = term.status === 'paid' && Number(term.paidAmount || 0) >= Number(term.expectedAmount || 0)
            if (!isPaid) continue
            out.push({
              key: `rent_${p.id}_${b.id}_${r.id}_${term.id}`,
              kind: 'rent',
              propertyId: p.id,
              blockId: b.id,
              roomId: r.id,
              roomNo: r.roomNo,
              tenant: r.tenant,
              title: `房租 第${term.term}期`,
              amount: Number(term.expectedAmount || 0) || 0,
              dueDate: term.dueDate,
              payDate: term.payDate || '',
              receiptPic: Boolean(term.receiptPic),
            })
          }

          for (const bill of r.bills || []) {
            if (bill.status !== 'paid') continue
            if (bill.type === 'rent') continue
            out.push({
              key: `bill_${p.id}_${b.id}_${r.id}_${bill.id}`,
              kind: bill.type || 'custom',
              propertyId: p.id,
              blockId: b.id,
              roomId: r.id,
              roomNo: r.roomNo,
              tenant: r.tenant,
              title: bill.title || '费用',
              amount: Number(bill.amount || 0) || 0,
              dueDate: bill.dueDate,
              payDate: bill.payDate || '',
              receiptPic: Boolean(bill.receiptPic),
            })
          }
        }
      }
    }
  }
  out.sort((a, b) => String(b.payDate || '').localeCompare(String(a.payDate || '')))
  return out
})

const items = computed(() => {
  let list = entries.value.slice()
  if (typeTab.value !== 'all') list = list.filter((x) => x.kind === typeTab.value)
  if (startDate.value || endDate.value) {
    list = list.filter((item) => matchesDateWindow(item.payDate || item.dueDate, startDate.value, endDate.value))
  }

  const q = String(search.value || '').trim().toLowerCase()
  if (q) {
    list = list.filter((item) =>
      [item.roomNo, item.tenant, item.title]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    )
  }

  list.sort((a, b) => compareItems(a, b, sortKey.value, sortOrder.value))
  return list
})

const currentTypeLabel = computed(() => typeOptions.find((item) => item.value === typeDraft.value)?.label || '全部')

const dateSummaryText = computed(() => {
  if (!startDateDraft.value && !endDateDraft.value) return '全部日期'
  if (startDateDraft.value && endDateDraft.value) return `${fmtDate(startDateDraft.value)} 至 ${fmtDate(endDateDraft.value)}`
  if (startDateDraft.value) return `${fmtDate(startDateDraft.value)} 起`
  return `截至 ${fmtDate(endDateDraft.value)}`
})

const activeQuickDate = computed(() => {
  if (!startDateDraft.value && !endDateDraft.value) return 'all'

  const now = new Date()
  const yearStart = `${now.getFullYear()}-01-01`
  if (startDateDraft.value === yearStart && endDateDraft.value === formatDateValue(now)) return 'year'

  const last30 = formatDateOffset(now, -30)
  if (startDateDraft.value === last30 && endDateDraft.value === formatDateValue(now)) return 'month'

  const last90 = formatDateOffset(now, -90)
  if (startDateDraft.value === last90 && endDateDraft.value === formatDateValue(now)) return 'quarter'

  return ''
})

function applySearch() {
  if (!isValidDateInput(startDateDraft.value) || !isValidDateInput(endDateDraft.value)) {
    uni.showToast({ title: '日期格式应为 YYYY-MM-DD', icon: 'none' })
    return
  }
  if (startDateDraft.value && endDateDraft.value && startDateDraft.value > endDateDraft.value) {
    uni.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
    return
  }
  typeMenuOpen.value = false
  typeTab.value = typeDraft.value
  startDate.value = startDateDraft.value
  endDate.value = endDateDraft.value
  search.value = searchDraft.value.trim()
}

function toggleSort(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
    return
  }
  sortKey.value = key
  sortOrder.value = key === 'amount' ? 'desc' : 'desc'
}

function compareItems(a, b, key, order) {
  let result = 0
  if (key === 'amount') {
    result = Number(a.amount || 0) - Number(b.amount || 0)
  } else {
    const aTime = parseDateValue(a.payDate || a.dueDate)?.getTime() || 0
    const bTime = parseDateValue(b.payDate || b.dueDate)?.getTime() || 0
    result = aTime - bTime
  }
  return order === 'desc' ? -result : result
}

function matchesDateWindow(value, start, end) {
  const targetDate = parseDateValue(value)
  if (!targetDate) return false

  const startTime = parseDateValue(start)
  const endTime = parseDateValue(end, true)

  if (startTime && targetDate.getTime() < startTime.getTime()) return false
  if (endTime && targetDate.getTime() > endTime.getTime()) return false
  return true
}

function parseDateValue(value, endOfDay = false) {
  const text = String(value || '').trim()
  if (!text) return null

  const normalized = text.includes(' ') ? text.replace(' ', 'T') : `${text}T${endOfDay ? '23:59:59' : '00:00:00'}`
  const targetDate = new Date(normalized)
  return Number.isNaN(targetDate.getTime()) ? null : targetDate
}

function isValidDateInput(value) {
  const text = String(value || '').trim()
  if (!text) return true
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && Boolean(parseDateValue(text))
}

function toggleTypeMenu() {
  typeMenuOpen.value = !typeMenuOpen.value
}

function selectType(value) {
  typeDraft.value = value
  typeMenuOpen.value = false
}

function openDateDrawer() {
  typeMenuOpen.value = false
  dateDrawerOpen.value = true
}

function closeDateDrawer() {
  dateDrawerOpen.value = false
}

function clearDateDraft() {
  startDateDraft.value = ''
  endDateDraft.value = ''
}

function applyQuickDate(value) {
  const now = new Date()
  if (value === 'all') {
    clearDateDraft()
    return
  }
  if (value === 'year') {
    startDateDraft.value = `${now.getFullYear()}-01-01`
    endDateDraft.value = formatDateValue(now)
    return
  }
  if (value === 'month') {
    startDateDraft.value = formatDateOffset(now, -30)
    endDateDraft.value = formatDateValue(now)
    return
  }
  if (value === 'quarter') {
    startDateDraft.value = formatDateOffset(now, -90)
    endDateDraft.value = formatDateValue(now)
  }
}

function confirmDateDrawer() {
  if (!isValidDateInput(startDateDraft.value) || !isValidDateInput(endDateDraft.value)) {
    uni.showToast({ title: '日期格式应为 YYYY-MM-DD', icon: 'none' })
    return
  }
  if (startDateDraft.value && endDateDraft.value && startDateDraft.value > endDateDraft.value) {
    uni.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
    return
  }
  dateDrawerOpen.value = false
}

function formatDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateOffset(baseDate, offsetDays) {
  const next = new Date(baseDate)
  next.setDate(next.getDate() + offsetDays)
  return formatDateValue(next)
}

const billStats = computed(() => {
  const list = entries.value
  const sumByKind = (kind) => Math.round(list.filter((item) => item.kind === kind).reduce((total, item) => total + Number(item.amount || 0), 0) * 100) / 100
  return {
    paidTotal: Math.round(list.reduce((total, item) => total + Number(item.amount || 0), 0) * 100) / 100,
    rentPaid: sumByKind('rent'),
    utilsPaid: sumByKind('utilities'),
    customPaid: sumByKind('custom'),
  }
})

function typeText(kind) {
  if (kind === 'rent') return '房租'
  if (kind === 'utilities') return '水电'
  return '灵活'
}

function typeTag(kind) {
  if (kind === 'rent') return 'bg-slate-100 text-slate-700 border-slate-200'
  if (kind === 'utilities') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

function goRoom(item) {
  safeNavigateTo(`/pages/room/detail?propertyId=${item.propertyId}&blockId=${item.blockId}&roomId=${item.roomId}`)
}

function openReceipt(item) {
  typeMenuOpen.value = false
  receiptItem.value = item
  receiptOpen.value = true
}

function closeReceipt() {
  receiptOpen.value = false
  receiptItem.value = null
}
</script>

<style>
.bills-toolbar {
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
}

.bills-section-title {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.bills-searchbar {
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
  min-height: 38px;
}

.bills-search-field {
  padding: 0.375rem 0.625rem;
  border-radius: 0.75rem;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
  min-height: 32px;
}

.bills-search-field-compact {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  min-height: 28px;
}

.bills-filter-field {
  padding: 0.25rem 0.625rem;
  border-radius: 0.75rem;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  min-height: 28px;
}

.bill-search-input {
  min-height: 14px;
  line-height: 14px;
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.bill-search-placeholder {
  color: #94a3b8;
}

.bills-query-button {
  min-height: 28px;
  min-width: 0;
  padding: 0 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.bills-toolbar-row {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) 76px;
  gap: 0.5rem;
  align-items: stretch;
}

.bills-type-cell {
  min-width: 0;
}

.bills-date-cell {
  min-width: 0;
}

.bills-type-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 30;
  padding: 4px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.bills-type-option {
  padding: 8px 10px;
  border-radius: 8px;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}

.bills-type-option-active {
  background: #eff6ff;
  color: #2563eb;
}

.bills-history-card {
  padding-bottom: 8px;
}

.bills-sort-button {
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  min-height: auto;
}

.bills-sort-button-active {
  color: #2563eb;
}
</style>
