<template>
  <view>
    <view v-if="items.length === 0" class="p-4 rounded-2xl bg-white border border-slate-200-60 shadow-soft">
      <view class="text-sm text-slate-600 font-medium">暂无入住历史。</view>
    </view>

    <view v-else class="stack-3">
      <view v-for="(occ, idx) in items" :key="occ.id" class="flex gap-3">
        <view class="w-6 flex flex-col items-center">
          <view class="w-3 h-3 rounded-full border border-slate-200 shadow-soft" :class="dotClass(occ)"></view>
          <view v-if="idx !== items.length - 1" class="w-px flex-1 mt-2 bg-slate-200 opacity-70"></view>
        </view>

        <view class="flex-1 pb-2">
          <view class="p-4 rounded-2xl border border-slate-200-60 shadow-soft" :class="cardClass(occ)">
            <view class="flex items-start justify-between gap-3">
              <view class="min-w-0">
                <view class="font-black text-slate-900 text-sm truncate">
                  {{ occ.kind === 'idle' ? '空置期' : (occ.tenant || '未知租客') }}
                </view>
                <view class="text-2xs text-slate-500 font-mono mt-1 truncate">
                  {{ formatRange(occ) }}
                </view>
              </view>
              <view class="text-2xs font-bold px-3 py-1 rounded-full border shrink-0" :class="tagClass(occ)">
                {{ tagText(occ) }}
              </view>
            </view>

            <view v-if="occ.kind === 'lease'" class="text-2xs text-slate-500 font-mono mt-2 opacity-80">
              ￥{{ occ.rent }}/期<text class="mx-2 text-slate-200">|</text>{{ cycleLabel(occ.paymentCycle) }}<text class="mx-2 text-slate-200">|</text>押金￥{{ occ.deposit }}
            </view>

            <view v-if="occ.archive" class="text-2xs text-slate-400 font-medium mt-2">
              已归档:
              <text class="font-mono">{{ (occ.archive.bills || []).length }}</text> 笔账单
              <text class="mx-1 text-slate-200">|</text>
              <text class="font-mono">{{ (occ.archive.meterReadings || []).length }}</text> 次抄表
            </view>

            <view v-if="occ.remark" class="text-xs text-slate-700 font-medium mt-2 leading-relaxed">
              {{ occ.remark }}
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  occupancies: { type: Array, default: () => [] },
})

const items = computed(() => {
  const list = Array.isArray(props.occupancies) ? props.occupancies.slice() : []
  list.sort((a, b) => {
    const as = String(a.startDate || '')
    const bs = String(b.startDate || '')
    if (as === bs) return 0
    return as < bs ? 1 : -1
  })
  return list
})

function safeDate(d) {
  const s = String(d || '').trim()
  return s || '-'
}

function formatRange(occ) {
  const start = safeDate(occ.startDate)
  const end = String(occ.endDate || '').trim()
  if (end) return `${start} ~ ${end}`
  if (occ.kind === 'idle') return `${start} ~ 至今`
  if (occ.status === 'active') return `${start} ~ 进行中`
  return `${start} ~ -`
}

function cycleLabel(n) {
  const x = Number(n || 0)
  if (x === 1) return '月付'
  if (x === 3) return '季付'
  if (x === 6) return '半年付'
  if (x === 12) return '年付'
  return `${x}月/期`
}

function tagText(occ) {
  if (occ.status === 'active') return '当前'
  if (occ.kind === 'idle') return '空置'
  return '已退租'
}

function tagClass(occ) {
  if (occ.status === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (occ.kind === 'idle') return 'bg-slate-50 text-slate-600 border-slate-200'
  return 'bg-white text-slate-600 border-slate-200'
}

function cardClass(occ) {
  if (occ.status === 'active') return 'bg-emerald-50 border-emerald-200'
  if (occ.kind === 'idle') return 'bg-slate-50 border-slate-200'
  return 'bg-white border-slate-200-60'
}

function dotClass(occ) {
  if (occ.status === 'active') return 'bg-emerald-500 border-emerald-200'
  if (occ.kind === 'idle') return 'bg-slate-300 border-slate-200'
  return 'bg-blue-500 border-blue-200'
}
</script>
