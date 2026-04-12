<template>
  <BaseCenteredModal :open="open" :title="title" :subtitle="subtitle" body-class="stack-3" @close="emit('close')">
    <view class="checkout-status-grid">
      <view class="checkout-status-card">
        <view class="checkout-status-top">
          <view class="checkout-status-label">租金缴纳情况</view>
          <view class="checkout-status-lamp" :class="rentStatusClass"></view>
        </view>
        <view class="checkout-status-main">{{ rentStatusText }}</view>
        <view class="checkout-status-sub">{{ rentStatusNote }}</view>
      </view>
      <view class="checkout-status-card">
        <view class="checkout-status-top">
          <view class="checkout-status-label">附加费用情况</view>
          <view class="checkout-status-lamp" :class="utilityStatusClass"></view>
        </view>
        <view class="checkout-status-main">{{ utilityStatusText }}</view>
        <view class="checkout-status-sub">{{ utilityStatusNote }}</view>
      </view>
    </view>

    <view class="checkout-form-grid">
      <view class="checkout-field-card checkout-field-card-span">
        <view class="checkout-field-label">退押金</view>
        <input :value="refund" type="number" class="checkout-field-input" placeholder="输入退押金额" @input="emit('update:refund', $event.detail.value)" />
        <view class="checkout-field-hint">将记录为本次退租结算。</view>
      </view>
    </view>

    <template #footer>
      <ActionFooterRow secondary-label="取消" primary-label="确认退租" primary-class="checkout-footer-primary" @secondary="emit('close')" @primary="emit('confirm')" />
    </template>
  </BaseCenteredModal>
</template>

<script setup>
import ActionFooterRow from './ActionFooterRow.vue'
import BaseCenteredModal from './BaseCenteredModal.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '办理退租' },
  subtitle: { type: String, default: '' },
  rentStatusText: { type: String, default: '' },
  rentStatusNote: { type: String, default: '' },
  rentStatusClass: { type: String, default: 'checkout-status-lamp-slate' },
  utilityStatusText: { type: String, default: '' },
  utilityStatusNote: { type: String, default: '' },
  utilityStatusClass: { type: String, default: 'checkout-status-lamp-slate' },
  refund: { type: [String, Number], default: '' },
})

const emit = defineEmits(['close', 'confirm', 'update:refund'])
</script>

<style>
.checkout-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.checkout-status-card,
.checkout-field-card {
  padding: 20rpx;
  border-radius: 24rpx;
  background: #ffffff;
  border: 1rpx solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 10rpx 28rpx rgba(15, 23, 42, 0.05);
}

.checkout-status-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.checkout-status-label,
.checkout-field-label {
  font-size: 24rpx;
  font-weight: 800;
  color: #334155;
}

.checkout-status-main {
  margin-top: 14rpx;
  font-size: 30rpx;
  font-weight: 800;
  color: #0f172a;
}

.checkout-status-sub,
.checkout-field-hint {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #94a3b8;
}

.checkout-status-lamp {
  width: 16rpx;
  height: 16rpx;
  border-radius: 9999rpx;
  flex-shrink: 0;
  box-shadow: 0 0 0 4rpx rgba(148, 163, 184, 0.08);
}

.checkout-status-lamp-done {
  background: #10b981;
  box-shadow: 0 0 0 4rpx rgba(16, 185, 129, 0.12);
}

.checkout-status-lamp-partial {
  background: #f59e0b;
  box-shadow: 0 0 0 4rpx rgba(245, 158, 11, 0.12);
}

.checkout-status-lamp-pending {
  background: #cbd5e1;
  box-shadow: 0 0 0 4rpx rgba(203, 213, 225, 0.22);
}

.checkout-status-lamp-overdue {
  background: #f43f5e;
  box-shadow: 0 0 0 4rpx rgba(244, 63, 94, 0.12);
}

.checkout-status-lamp-slate {
  background: #94a3b8;
}

.checkout-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.checkout-field-card-span {
  grid-column: span 2;
}

.checkout-field-input {
  width: 100%;
  height: 72rpx;
  margin-top: 12rpx;
  padding: 0 18rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  background: #f8fafc;
  font-size: 28rpx;
  line-height: 72rpx;
  font-weight: 500;
  color: #0f172a;
  box-sizing: border-box;
}

.checkout-footer-primary {
  background: linear-gradient(135deg, #fb7185, #ef4444);
  box-shadow: 0 16rpx 28rpx rgba(239, 68, 68, 0.18);
}
</style>
