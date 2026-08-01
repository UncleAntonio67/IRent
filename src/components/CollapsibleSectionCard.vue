<template>
  <view class="section-card">
    <view class="section-card-trigger w-full flex items-center justify-between bg-transparent p-0 text-left tap-scale" @click="emit('toggle')">
      <view :class="titleClass">{{ title }}</view>
      <view class="flex items-center justify-end gap-2 shrink-0 collapse-indicator">
        <view class="text-2xs text-slate-500 font-semibold">{{ expanded ? collapseLabel : expandLabel }}</view>
        <view class="collapse-chevron" :class="expanded ? 'collapse-chevron-open' : ''"></view>
      </view>
    </view>
    <view v-if="expanded" :class="bodyClass">
      <slot />
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  expanded: { type: Boolean, default: true },
  expandLabel: { type: String, default: '展开' },
  collapseLabel: { type: String, default: '收起' },
  titleClass: { type: String, default: 'text-sm font-bold text-slate-800' },
  bodyClass: { type: String, default: 'mt-3' },
})

const emit = defineEmits(['toggle'])
</script>

<style>
.section-card {
  padding: 28rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.045);
}

.section-card-trigger {
  min-height: 44rpx;
}

.collapse-chevron {
  width: 16rpx;
  height: 16rpx;
  border-right: 2rpx solid #94a3b8;
  border-bottom: 2rpx solid #94a3b8;
  transform: rotate(-45deg);
  transition: transform 160ms ease, border-color 160ms ease;
}

.collapse-chevron-open {
  transform: rotate(45deg);
  border-color: #475569;
}

.collapse-indicator {
  min-width: 112rpx;
}
</style>

