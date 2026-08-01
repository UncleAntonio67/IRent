<template>
  <CollapsibleSectionCard v-if="visible" title="收费明细" :expanded="expanded" title-class="text-sm text-slate-700 font-bold" @toggle="emit('toggle')">
    <view v-if="rows.length === 0" class="text-sm text-slate-500 font-medium">暂无收款记录。</view>
    <view v-else class="rounded-2xl overflow-hidden bg-slate-50">
      <view class="compact-table-head"><text class="compact-table-head-left">日期</text><text class="compact-table-head-left">项目</text><text class="compact-table-head-right">金额</text></view>
      <view v-for="item in rows" :key="item.id" class="compact-table-row">
        <text class="compact-table-date">{{ item.dateText }}</text>
        <view class="min-w-0"><view class="compact-table-title truncate">{{ item.scopeText }}</view><view class="compact-table-sub">{{ item.noteText }}</view></view>
        <text class="compact-table-amount">￥{{ item.amount }}</text>
      </view>
    </view>
  </CollapsibleSectionCard>
</template>

<script setup>
import CollapsibleSectionCard from './CollapsibleSectionCard.vue'
defineProps({ visible: Boolean, expanded: Boolean, rows: { type: Array, default: () => [] } })
const emit = defineEmits(['toggle'])
</script>

<style scoped>
.compact-table-head,.compact-table-row{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,2.25fr) minmax(0,.85fr);gap:18rpx;align-items:center}.compact-table-head{padding:18rpx 20rpx;background:#f8fafc;color:#64748b;font-size: 26rpx;font-weight:600}.compact-table-head-left{text-align:left}.compact-table-head-right{text-align:right}.compact-table-row{padding:22rpx 20rpx;border-top:1rpx solid rgba(226,232,240,.9);align-items:start}.compact-table-date{color:#64748b;font-size: 24rpx;line-height:1.4;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace}.compact-table-title{color:#0f172a;font-size: 28rpx;font-weight:600;line-height:1.35}.compact-table-sub{margin-top:6rpx;color:#94a3b8;font-size: 24rpx;font-weight:500;line-height:1.35}.compact-table-amount{color:#047857;font-size: 28rpx;font-weight:700;line-height:1.4;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace}
</style>
