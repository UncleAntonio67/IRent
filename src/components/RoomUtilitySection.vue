<template>
  <CollapsibleSectionCard v-if="visible" title="附加收费" :expanded="expanded" title-class="text-sm text-slate-700 font-bold" @toggle="emit('toggle')">
    <view v-if="allIncluded" class="mt-3 p-3 rounded-2xl bg-slate-50 text-sm text-slate-500 font-medium">水费、电费、燃气、供暖均已包含在房租中。</view>
    <view v-else-if="hasMeterUtility" class="utility-meter-strip mt-3" :class="meterStripClass">
      <view v-if="showWaterMeterCard" class="utility-meter-card"><view class="text-2xs text-slate-500">当前水表</view><view class="text-sm font-semibold text-slate-900 mt-1">{{ waterMeter }}</view><view class="text-2xs text-slate-400 mt-1">单价 ￥{{ waterPrice }}/吨</view></view>
      <view v-if="showElectricMeterCard" class="utility-meter-card"><view class="text-2xs text-slate-500">当前电表</view><view class="text-sm font-semibold text-slate-900 mt-1">{{ electricMeter }}</view><view class="text-2xs text-slate-400 mt-1">单价 ￥{{ electricPrice }}/度</view></view>
      <view class="utility-meter-action"><button class="utility-meter-button tap-scale" @click="emit('meter')"><text>抄</text><text>表</text></button></view>
    </view>
    <view v-if="rows.length" class="mt-2 rounded-xl overflow-hidden bg-slate-50">
      <view class="utility-table-head"><text>项目</text><text>金额</text><text>状态</text><text>操作</text></view>
      <view v-for="item in rows" :key="item.type" class="utility-table-row">
        <view class="utility-type"><view class="utility-type-name">{{ item.label }}</view></view>
        <view class="term-money-stack"><view class="term-money-row"><text class="term-money-label">应</text><text>￥{{ item.expected }}</text></view><view class="term-money-row term-money-sub"><text class="term-money-label">收</text><text>￥{{ item.paid }}</text></view></view>
        <view class="term-state"><view class="term-status-lamp" :class="item.statusLampClass"></view></view>
        <view class="utility-action"><view v-if="item.included" class="utility-included-text">已计入租金</view><button v-else class="utility-action-primary tap-scale" @click="emit('collect', item.type)">收费</button></view>
      </view>
    </view>
  </CollapsibleSectionCard>
</template>

<script setup>
import CollapsibleSectionCard from './CollapsibleSectionCard.vue'
defineProps({ visible: Boolean, expanded: Boolean, allIncluded: Boolean, hasMeterUtility: Boolean, meterStripClass: String, showWaterMeterCard: Boolean, showElectricMeterCard: Boolean, waterMeter: [String, Number], electricMeter: [String, Number], waterPrice: [String, Number], electricPrice: [String, Number], rows: { type: Array, default: () => [] } })
const emit = defineEmits(['toggle', 'meter', 'collect'])
</script>

<style scoped>
.utility-meter-strip{display:grid;gap:12rpx;align-items:stretch}.utility-meter-strip-double{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto}.utility-meter-strip-single{grid-template-columns:minmax(0,1fr) auto}.utility-meter-card{min-width:0;padding:24rpx;border-radius:20rpx;background:#f8fafc}.utility-meter-action{display:flex;align-items:center;justify-content:flex-end}.utility-meter-button{width:82rpx;height:128rpx;border-radius:20rpx;background:#ecfdf5;color:#047857;font-size: 26rpx;font-weight:700;line-height:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12rpx}
.utility-table-head,.utility-table-row{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.15fr) minmax(0,.7fr) minmax(0,.95fr);gap:12rpx;align-items:center;text-align:center}.utility-table-head{padding:18rpx;background:#f8fafc;color:#64748b;font-size: 28rpx;font-weight:600}.utility-table-row{padding:22rpx 18rpx;border-top:1rpx solid rgba(226,232,240,.9)}.utility-type,.term-state,.utility-action,.term-money-stack{display:flex;align-items:center;justify-content:center;min-width:0}.utility-type-name{font-size: 30rpx;font-weight:500;color:#0f172a}.term-money-stack{flex-direction:column}.term-money-row{display:grid;grid-template-columns:26rpx minmax(0,1fr);column-gap:6rpx;min-width:142rpx;text-align:left;color:#0f172a;font-size: 30rpx;font-weight:500;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace;line-height:1.2}.term-money-label{color:#94a3b8;font-size: 24rpx;text-align:right}.term-money-sub{margin-top:5rpx;color:#64748b;font-size: 26rpx}.term-status-lamp{width:18rpx;height:18rpx;border-radius:9999rpx;box-shadow:0 0 0 4rpx rgba(148,163,184,.08)}.term-status-lamp-done{background:#10b981}.term-status-lamp-partial{background:#f59e0b}.term-status-lamp-pending{background:#cbd5e1}.utility-action-primary{min-width:104rpx;padding:16rpx 20rpx;border-radius:14rpx;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;font-size: 28rpx;font-weight:700;line-height:1;box-shadow:0 10rpx 18rpx rgba(37,99,235,.18)}.utility-included-text{font-size: 24rpx;line-height:1.3;color:#94a3b8;font-weight:500;text-align:center}
</style>
