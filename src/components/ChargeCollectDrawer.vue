<template>
  <BaseCenteredModal :open="open" :title="title" :subtitle="subtitle" body-class="stack-3" @close="emit('close')">
    <view class="charge-drawer-hero" :class="heroToneClass">
      <view class="charge-drawer-hero-top"><view class="charge-drawer-hero-label">{{ heroLabel }}</view><view class="charge-drawer-hero-badge">{{ heroBadge }}</view></view>
      <view class="charge-drawer-hero-amount">￥{{ heroAmount }}</view>
      <view class="charge-drawer-hero-bottom"><view><view class="charge-drawer-hero-sub-label">{{ leftLabel }}</view><view class="charge-drawer-hero-sub-value">{{ leftValue }}</view></view><view class="text-right"><view class="charge-drawer-hero-sub-label">{{ rightLabel }}</view><view class="charge-drawer-hero-sub-value">{{ rightValue }}</view></view></view>
    </view>
    <view class="charge-drawer-section">
      <view class="charge-drawer-label">{{ inputLabel }}</view>
      <view class="charge-drawer-entry-row"><view class="charge-drawer-input-wrap"><view class="charge-drawer-currency">￥</view><input :value="modelValue" type="number" class="charge-drawer-input" :placeholder="placeholder" @input="emit('update:modelValue', $event.detail.value)" /></view><button class="charge-drawer-upload-button tap-scale" :class="receiptPicked ? 'charge-drawer-upload-button-done' : ''" @click="emit('pick-receipt')">{{ receiptPicked ? '重新上传' : '上传凭证' }}</button></view>
      <view v-if="helperText" class="charge-drawer-helper">{{ helperText }}</view>
    </view>
    <template #footer><ActionFooterRow secondary-label="取消" :primary-label="confirmLabel" :primary-disabled="confirmDisabled" @secondary="emit('close')" @primary="emit('confirm')" /></template>
  </BaseCenteredModal>
</template>

<script setup>
import { computed } from 'vue'
import ActionFooterRow from './ActionFooterRow.vue'
import BaseCenteredModal from './BaseCenteredModal.vue'

const props = defineProps({
  open: Boolean, title: String, subtitle: String,
  heroLabel: { type: String, default: '应收总额' }, heroBadge: { type: String, default: '待收费' }, heroAmount: { type: [String, Number], default: '' },
  leftLabel: { type: String, default: '已收金额' }, leftValue: String, rightLabel: { type: String, default: '本次待收' }, rightValue: String,
  inputLabel: { type: String, default: '本次实收金额' }, modelValue: { type: [String, Number], default: '' }, placeholder: { type: String, default: '0.00' },
  receiptPicked: Boolean, receiptFileName: { type: String, default: '未上传凭证' }, receiptPendingText: { type: String, default: '' },
  confirmLabel: { type: String, default: '确认收款' }, confirmDisabled: Boolean, helperText: String, heroTone: { type: String, default: 'blue' },
})
const emit = defineEmits(['close', 'confirm', 'pick-receipt', 'update:modelValue'])
const heroToneClass = computed(() => props.heroTone === 'amber' ? 'charge-drawer-hero-amber' : 'charge-drawer-hero-blue')
</script>

<style scoped>
.charge-drawer-hero{padding:24rpx;border-radius:24rpx;color:#fff}.charge-drawer-hero-blue{background:linear-gradient(135deg,#4f46e5,#3b82f6);box-shadow:0 18rpx 36rpx rgba(59,130,246,.18)}.charge-drawer-hero-amber{background:linear-gradient(135deg,#f59e0b,#f97316);box-shadow:0 18rpx 36rpx rgba(249,115,22,.18)}.charge-drawer-hero-top,.charge-drawer-hero-bottom,.charge-drawer-entry-row{display:flex;align-items:center;justify-content:space-between;gap:16rpx}.charge-drawer-hero-label,.charge-drawer-hero-sub-label{font-size: 20rpx;font-weight:500;color:rgba(219,234,254,.86)}.charge-drawer-hero-badge{padding:6rpx 14rpx;border-radius:12rpx;background:rgba(255,255,255,.18);font-size: 16rpx;font-weight:600}.charge-drawer-hero-amount{margin-top:18rpx;font-size: 48rpx;font-weight:800;line-height:1;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace}.charge-drawer-hero-bottom{margin-top:22rpx;padding-top:18rpx;border-top:1rpx solid rgba(255,255,255,.24);align-items:flex-start}.charge-drawer-hero-sub-value{margin-top:6rpx;font-size: 26rpx;font-weight:700}.charge-drawer-section{padding:24rpx;border-radius:24rpx;background:#fff;box-shadow:0 8rpx 24rpx rgba(15,23,42,.055)}.charge-drawer-label{font-size: 24rpx;font-weight:700;color:#334155}.charge-drawer-entry-row{margin-top:16rpx}.charge-drawer-input-wrap{position:relative;flex:1;min-width:0}.charge-drawer-currency{position:absolute;left:22rpx;top:50%;transform:translateY(-50%);color:#94a3b8;font-size: 30rpx;font-weight:700}.charge-drawer-input{width:100%;height:82rpx;padding:0 20rpx 0 52rpx;border-radius:20rpx;border:1rpx solid #e2e8f0;background:#f8fafc;color:#0f172a;font-size: 32rpx;font-weight:600;box-sizing:border-box}.charge-drawer-upload-button{height:82rpx;padding:0 20rpx;border-radius:20rpx;background:#eff6ff;color:#2563eb;font-size: 22rpx;font-weight:700;white-space:nowrap;display:flex;align-items:center;justify-content:center;line-height:1;box-sizing:border-box}.charge-drawer-upload-button-done{background:#ecfdf5;color:#047857}.charge-drawer-inline-status{margin-top:12rpx;font-size: 20rpx;color:#94a3b8}.charge-drawer-inline-status-done{color:#047857}.charge-drawer-helper{margin-top:10rpx;font-size: 20rpx;color:#d97706}
</style>
