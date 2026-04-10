<template>
  <view class="h-screen bg-slate-50 text-slate-800">
    <view class="mx-auto max-w-md h-screen flex flex-col shadow-2xl bg-slate-50 relative overflow-hidden">
      <view class="bg-white-80 border-b px-5 pb-3 border-slate-200-60 relative shrink-0 sticky-header z-20 shadow-soft" :style="{ paddingTop: headerTopPadding + 'px' }">
        <view class="flex items-center justify-between">
          <view>
            <view class="font-black text-slate-900 text-base">账务流水</view>
            <view class="text-xs text-slate-400 font-medium mt-0_5">只查看已完成收款记录</view>
          </view>
          <view class="chip-soft px-3 py-1_5 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1_5">
            <view class="w-4 h-4 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-3xs font-black">年</view>
            全年
          </view>
        </view>

        <view class="mt-4 p-6 rounded-2xl bills-hero text-white relative overflow-hidden shadow-lg">
          <view class="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white-20"></view>
          <view class="absolute -right-2 -bottom-2 w-28 h-28 rounded-full bg-white-20"></view>
          <view class="absolute -right-6 -bottom-10 text-8xl font-black opacity-10 pointer-events-none select-none">账</view>

          <view class="text-blue-100 text-xs font-medium mb-2">累计实收金额（元）</view>
          <view class="text-4xl font-black font-mono tracking-tight">¥{{ fmtMoney(billStats.paidTotal) }}</view>

          <view class="grid grid-cols-3 gap-3 border-t border-white-20 pt-4 mt-6">
            <view class="rounded-2xl bg-white-20 p-3">
              <view class="text-blue-100 text-2xs font-medium">房租实收</view>
              <view class="font-mono font-black text-sm mt-2">¥{{ fmtMoney(billStats.rentPaid) }}</view>
            </view>
            <view class="rounded-2xl bg-white-20 p-3">
              <view class="text-blue-100 text-2xs font-medium">水电实收</view>
              <view class="font-mono font-black text-sm mt-2">¥{{ fmtMoney(billStats.utilsPaid) }}</view>
            </view>
            <view class="rounded-2xl bg-white-20 p-3">
              <view class="text-blue-100 text-2xs font-medium">灵活实收</view>
              <view class="font-mono font-black text-sm mt-2">¥{{ fmtMoney(billStats.customPaid) }}</view>
            </view>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="page-scroll" :scroll-with-animation="true">
        <view class="p-5 stack-5" style="padding-bottom: 32rpx;">
          <view class="grid grid-cols-3 gap-2">
            <view class="p-3 rounded-2xl surface-card">
              <view class="text-2xs text-slate-400 font-bold">流水笔数</view>
              <view class="text-lg font-black font-mono text-slate-900 mt-1">{{ paidCount }}</view>
            </view>
            <view class="p-3 rounded-2xl surface-card">
              <view class="text-2xs text-slate-400 font-bold">凭证留存</view>
              <view class="text-lg font-black font-mono text-blue-600 mt-1">{{ receiptCount }}</view>
            </view>
            <view class="p-3 rounded-2xl surface-card">
              <view class="text-2xs text-slate-400 font-bold">房间数</view>
              <view class="text-lg font-black font-mono text-emerald-600 mt-1">{{ roomCount }}</view>
            </view>
          </view>

          <view class="p-4 rounded-2xl surface-card">
            <view class="flex items-center gap-2">
              <view class="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-sm shrink-0">流</view>
              <view class="min-w-0">
                <view class="font-black text-slate-800 text-base truncate">历史流水</view>
                <view class="text-2xs text-slate-400 font-medium mt-0_5">按类型、房号和租客快速筛选已收记录</view>
              </view>
            </view>

            <scroll-view scroll-x show-scrollbar="false" class="mt-4">
              <view class="flex gap-2 pb-1">
                <button class="whitespace-nowrap px-3 py-2_5 rounded-xl text-xs font-bold border tap-scale" :class="typeTab === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'" @click="typeTab = 'all'">全部</button>
                <button class="whitespace-nowrap px-3 py-2_5 rounded-xl text-xs font-bold border tap-scale" :class="typeTab === 'rent' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'" @click="typeTab = 'rent'">房租</button>
                <button class="whitespace-nowrap px-3 py-2_5 rounded-xl text-xs font-bold border tap-scale" :class="typeTab === 'utilities' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'" @click="typeTab = 'utilities'">水电杂费</button>
                <button class="whitespace-nowrap px-3 py-2_5 rounded-xl text-xs font-bold border tap-scale" :class="typeTab === 'custom' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'" @click="typeTab = 'custom'">灵活收费</button>
              </view>
            </scroll-view>

            <view class="mt-4 relative">
              <view class="absolute left-3 top-3 w-7 h-7 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xs font-black">搜</view>
              <input v-model="search" type="text" class="w-full pl-12 pr-4 py-3 rounded-xl input-soft font-medium" placeholder="按房号或租客姓名搜索" />
            </view>
          </view>

          <view v-if="items.length === 0" class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-400 font-medium text-sm">
            <view class="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 font-black text-lg mb-3">账</view>
            当前筛选下暂无历史流水
          </view>

          <view v-else class="stack-3">
            <view v-for="item in items" :key="item.key" class="p-4 rounded-2xl bg-white border border-slate-200-60 shadow-soft flex flex-col gap-3">
              <view class="flex justify-between items-start gap-3">
                <view class="min-w-0">
                  <view class="flex items-center gap-2">
                    <view class="font-black text-slate-900 truncate">{{ item.roomNo }}</view>
                    <view class="text-xs font-bold text-slate-500 truncate">{{ item.tenant || '未录入租客' }}</view>
                  </view>
                  <view class="text-sm font-bold text-slate-700 mt-1 truncate">{{ item.title }}</view>
                </view>
                <view class="flex items-center gap-2 shrink-0">
                  <view class="text-3xs font-black px-2 py-1 rounded-full border" :class="typeTag(item.kind)">{{ typeText(item.kind) }}</view>
                  <view class="text-3xs font-black px-2 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">已收</view>
                </view>
              </view>

              <view class="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                <view class="min-w-0 flex-1">
                  <view class="text-2xs text-slate-400 font-mono truncate">到期日 {{ fmtDate(item.dueDate) }}</view>
                  <view class="text-2xs text-slate-400 font-mono truncate mt-1">记收时间 {{ item.payDate || '-' }}</view>
                  <view v-if="item.receiptPic" class="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-3xs font-black border border-blue-200 tap-scale" @click.stop="openReceipt(item)">
                    <text>凭证</text>
                    <text class="text-blue-400">查看</text>
                  </view>
                </view>

                <view class="text-right flex flex-col items-end gap-2 shrink-0">
                  <view class="font-black font-mono text-lg leading-none text-emerald-600">+ ¥{{ fmtMoney(item.amount) }}</view>
                  <button class="text-2xs font-black px-3 py-2 rounded-xl btn-slate tap-scale" @click="goRoom(item)">查看房间</button>
                </view>
              </view>
            </view>
          </view>

          <view class="h-4"></view>
        </view>
      </scroll-view>

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

const headerTopPadding = ref(44)
const typeTab = ref('all')
const search = ref('')
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
  const q = String(search.value || '').trim().toLowerCase()
  if (q) list = list.filter((x) => String(x.roomNo || '').toLowerCase().includes(q) || String(x.tenant || '').toLowerCase().includes(q))
  return list
})

const billStats = computed(() => {
  const list = entries.value
  const sumByKind = (kind) => Math.round(list.filter((x) => x.kind === kind).reduce((s, x) => s + Number(x.amount || 0), 0) * 100) / 100
  return {
    paidTotal: Math.round(list.reduce((s, x) => s + Number(x.amount || 0), 0) * 100) / 100,
    rentPaid: sumByKind('rent'),
    utilsPaid: sumByKind('utilities'),
    customPaid: sumByKind('custom'),
  }
})

const paidCount = computed(() => entries.value.length)
const receiptCount = computed(() => entries.value.filter((x) => x.receiptPic).length)
const roomCount = computed(() => new Set(entries.value.map((x) => x.roomId)).size)

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

function goRoom(item) {
  safeNavigateTo(`/pages/room/detail?propertyId=${item.propertyId}&blockId=${item.blockId}&roomId=${item.roomId}`)
}

function openReceipt(item) {
  receiptItem.value = item
  receiptOpen.value = true
}

function closeReceipt() {
  receiptOpen.value = false
  receiptItem.value = null
}
</script>
