<template>
  <view>
    <view v-if="items.length === 0" class="p-4 rounded-2xl bg-white border border-slate-200-60 shadow-soft">
      <view class="text-sm text-slate-600 font-medium">暂无入住历史。</view>
    </view>

    <view v-else class="stack-2">
      <view v-for="(occ, idx) in items" :key="occ.id" class="flex gap-3">
        <view class="w-6 flex flex-col items-center shrink-0">
          <view class="w-3 h-3 rounded-full border border-slate-200 shadow-soft" :class="dotClass(occ)"></view>
          <view v-if="idx !== items.length - 1" class="w-px flex-1 mt-2 bg-slate-200 opacity-70"></view>
        </view>

        <view class="flex-1 pb-1">
          <view class="p-3 rounded-2xl border shadow-soft" :class="cardClass(occ)">
            <view class="flex items-start justify-between gap-3">
              <view class="min-w-0">
                <view class="text-sm font-semibold text-slate-900 truncate">{{ occ.tenant || '未记录租客' }}</view>
                <view class="text-2xs text-slate-500 font-medium mt-1">{{ formatRange(occ) }}</view>
              </view>
              <view class="text-2xs font-bold px-3 py-1 rounded-full border shrink-0" :class="tagClass(occ)">
                {{ occ.status === 'active' ? '当前' : '历史' }}
              </view>
            </view>

            <view class="grid grid-cols-3 gap-2 mt-3">
              <view class="p-2 rounded-xl bg-white-80 border border-slate-200-60">
                <view class="text-2xs text-slate-500 font-medium">手机号</view>
                <view class="text-xs font-medium text-slate-900 mt-1 truncate">{{ occ.phone || '-' }}</view>
              </view>
              <view class="p-2 rounded-xl bg-white-80 border border-slate-200-60">
                <view class="text-2xs text-slate-500 font-medium">租金总额</view>
                <view class="text-xs font-medium text-slate-900 font-mono mt-1">￥{{ occ.rentTotal || 0 }}</view>
              </view>
              <view class="p-2 rounded-xl bg-white-80 border border-slate-200-60">
                <view class="text-2xs text-slate-500 font-medium">附加费</view>
                <view class="text-xs font-medium text-slate-900 font-mono mt-1">￥{{ occ.extraTotal || 0 }}</view>
              </view>
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
  list.sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')))
  return list
})

function safeDate(value) {
  const text = String(value || '').trim()
  return text || '-'
}

function formatRange(occ) {
  const start = safeDate(occ.startDate)
  const end = String(occ.endDate || '').trim()
  if (end) return `${start} ~ ${end}`
  if (occ.status === 'active') return `${start} ~ 进行中`
  return `${start} ~ -`
}

function tagClass(occ) {
  return occ.status === 'active'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-sky-50 text-sky-700 border-sky-200'
}

function cardClass(occ) {
  return occ.status === 'active'
    ? 'bg-emerald-50 border-emerald-200'
    : 'bg-sky-50 border-sky-200'
}

function dotClass(occ) {
  return occ.status === 'active'
    ? 'bg-emerald-500 border-emerald-200'
    : 'bg-sky-500 border-sky-200'
}
</script>
