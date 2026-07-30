<template>
  <CollapsibleSectionCard
    v-if="visible"
    title="租金收费"
    :expanded="expanded"
    title-class="text-sm text-slate-700 font-bold"
    @toggle="emit('toggle')"
  >
    <view class="flex items-center gap-2">
      <view class="status-lamp" :class="statusLampClass"></view>
      <view class="text-2xs text-slate-500 font-semibold">{{ outstandingCount === 0 ? '已覆盖' : `待收 ${outstandingCount}` }}</view>
    </view>
    <view class="mt-3 p-3 rounded-2xl surface-muted">
      <view class="flex items-center justify-between text-xs font-bold text-slate-500"><view>房租收费进度</view><view>{{ progressPct }}%</view></view>
      <view class="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"><view class="h-2 rounded-full bg-blue-600" :style="{ width: progressPct + '%' }"></view></view>
      <view class="flex items-center justify-between text-2xs text-slate-500 font-mono mt-2"><view>已收 ￥{{ paid }}</view><view>应收 ￥{{ expected }}</view></view>
    </view>
    <view class="mt-2 rounded-xl overflow-hidden bg-slate-50">
      <view class="utility-table-head"><text>期次</text><text>金额</text><text>状态</text><text>操作</text></view>
      <view v-for="term in terms" :key="term.id" class="utility-table-row">
        <view class="utility-type"><view class="utility-type-name">{{ term.term }}</view></view>
        <view class="term-money-stack"><view class="term-money-row"><text class="term-money-label">应</text><text>￥{{ term.expectedAmount }}</text></view><view class="term-money-row term-money-sub"><text class="term-money-label">收</text><text>￥{{ term.coveredAmount }}</text></view></view>
        <view class="term-state"><view class="term-status-lamp" :class="term.statusLampClass"></view></view>
        <view class="utility-action"><button class="utility-action-primary tap-scale" :class="term.done ? 'term-action-button-done' : 'term-action-button-active'" :disabled="term.done" @click="emit('collect', term.id)">{{ term.actionLabel }}</button></view>
      </view>
    </view>
  </CollapsibleSectionCard>
</template>

<script setup>
import CollapsibleSectionCard from './CollapsibleSectionCard.vue'
defineProps({ visible: Boolean, expanded: Boolean, outstandingCount: Number, statusLampClass: String, progressPct: Number, paid: Number, expected: Number, terms: { type: Array, default: () => [] } })
const emit = defineEmits(['toggle', 'collect'])
</script>

<style scoped>
.status-lamp{width:18rpx;height:18rpx;border-radius:9999rpx;border:2rpx solid #fff;box-shadow:0 0 0 2rpx rgba(148,163,184,.12)}
.utility-table-head,.utility-table-row{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.15fr) minmax(0,.7fr) minmax(0,.95fr);gap:12rpx;align-items:center;text-align:center}
.utility-table-head{padding:18rpx;background:#f8fafc;color:#64748b;font-size:26rpx;font-weight:600}
.utility-table-row{padding:20rpx 18rpx;border-top:1rpx solid rgba(226,232,240,.9)}
.utility-type,.term-state,.utility-action,.term-money-stack{display:flex;align-items:center;justify-content:center;min-width:0}
.utility-type-name{font-size:28rpx;font-weight:500;color:#0f172a}
.term-money-stack{flex-direction:column}.term-money-row{display:grid;grid-template-columns:26rpx minmax(0,1fr);column-gap:6rpx;min-width:142rpx;text-align:left;color:#0f172a;font-size:28rpx;font-weight:500;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace;line-height:1.2}.term-money-label{color:#94a3b8;font-size:22rpx;text-align:right}.term-money-sub{margin-top:5rpx;color:#64748b;font-size:24rpx}
.term-status-lamp{width:16rpx;height:16rpx;border-radius:9999rpx;box-shadow:0 0 0 4rpx rgba(148,163,184,.08)}.term-status-lamp-done{background:#10b981}.term-status-lamp-overdue{background:#f43f5e}.term-status-lamp-partial{background:#f59e0b}.term-status-lamp-pending{background:#cbd5e1}
.utility-action-primary{min-width:104rpx;padding:16rpx 20rpx;border-radius:14rpx;font-size:26rpx;font-weight:700;line-height:1}.term-action-button-active{background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;box-shadow:0 10rpx 18rpx rgba(37,99,235,.18)}.term-action-button-done{background:#f3fdf6;color:#047857;box-shadow:none}
</style>
