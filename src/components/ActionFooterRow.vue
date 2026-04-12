<template>
  <view class="action-footer-row" :class="showSecondary ? '' : 'action-footer-row-single'">
    <button
      v-if="showSecondary"
      class="action-footer-secondary tap-scale"
      :class="secondaryClass"
      @click="emit('secondary')"
    >
      {{ secondaryLabel }}
    </button>
    <button
      class="action-footer-primary tap-scale"
      :class="[primaryClass, primaryDisabled ? 'action-footer-primary-disabled' : '', showSecondary ? '' : 'action-footer-primary-single']"
      :disabled="primaryDisabled"
      @click="emit('primary')"
    >
      <text>{{ primaryLabel }}</text>
      <slot name="primarySuffix" />
    </button>
  </view>
</template>

<script setup>
defineProps({
  showSecondary: { type: Boolean, default: true },
  secondaryLabel: { type: String, default: '取消' },
  primaryLabel: { type: String, default: '确认' },
  secondaryClass: { type: String, default: '' },
  primaryClass: { type: String, default: '' },
  primaryDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['secondary', 'primary'])
</script>

<style>
.action-footer-row {
  display: flex;
  gap: 20rpx;
}

.action-footer-row-single {
  gap: 0;
}

.action-footer-secondary {
  flex: 1;
  padding: 26rpx 22rpx;
  border-radius: 9999rpx;
  background: #ffffff;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  color: #475569;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 1;
  min-height: 78rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-footer-primary {
  flex: 1.4;
  padding: 26rpx 22rpx;
  border-radius: 9999rpx;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 800;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  box-shadow: 0 16rpx 28rpx rgba(37, 99, 235, 0.18);
  min-height: 78rpx;
}

.action-footer-primary-single {
  flex: 1;
}

.action-footer-primary-disabled {
  background: #cbd5e1;
  color: #ffffff;
  box-shadow: none;
}
</style>
