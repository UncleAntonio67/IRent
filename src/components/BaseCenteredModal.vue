<template>
  <view v-if="open" class="base-modal-mask" @click="emit('close')">
    <view class="base-modal-panel" @click.stop>
      <view class="base-modal-head">
        <view class="base-modal-grab"></view>
        <view class="base-modal-header-row">
          <view class="min-w-0">
            <view class="base-modal-title">{{ title }}</view>
            <view v-if="subtitle" class="base-modal-subtitle">{{ subtitle }}</view>
          </view>
          <button class="drawer-icon-button" @click="emit('close')">
            <view class="icon-close">
              <view class="icon-close-line"></view>
              <view class="icon-close-line icon-close-line-second"></view>
            </view>
          </button>
        </view>
      </view>

      <view class="base-modal-body" :class="bodyClass">
        <slot />
      </view>

      <view v-if="$slots.footer" class="base-modal-footer">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  bodyClass: { type: String, default: '' },
})

const emit = defineEmits(['close'])
</script>

<style>
.base-modal-mask {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx;
  background: rgba(15, 23, 42, 0.42);
}

.base-modal-panel {
  width: 100%;
  max-width: 660rpx;
  max-height: 78vh;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 28rpx 80rpx rgba(15, 23, 42, 0.22);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.base-modal-head {
  padding: 12rpx 20rpx 10rpx;
  border-bottom: 1rpx solid rgba(226, 232, 240, 0.72);
}

.base-modal-grab {
  width: 72rpx;
  height: 8rpx;
  border-radius: 9999rpx;
  background: #e2e8f0;
  margin: 0 auto;
}

.base-modal-header-row {
  margin-top: 12rpx;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.base-modal-title {
  font-size: 38rpx;
  line-height: 1.2;
  font-weight: 900;
  color: #0f172a;
}

.base-modal-subtitle {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.base-modal-body {
  padding: 20rpx;
  overflow-y: auto;
}

.base-modal-footer {
  padding: 12rpx 20rpx 18rpx;
  border-top: 1rpx solid rgba(226, 232, 240, 0.72);
  background: #ffffff;
}

@media (max-width: 380px) {
  .base-modal-mask { padding: 20rpx; }
}
</style>
