<template>
  <view class="p-3 rounded-2xl surface-card">
    <button class="w-full flex items-center justify-between bg-transparent p-0 pr-2 text-left tap-scale" @click="emit('toggle')">
      <view :class="titleClass">{{ title }}</view>
      <view class="flex items-center justify-end gap-2 shrink-0 collapse-indicator">
        <view class="text-2xs text-slate-500 font-semibold">{{ expanded ? collapseLabel : expandLabel }}</view>
        <view class="collapse-chevron" :class="expanded ? 'collapse-chevron-open' : ''"></view>
      </view>
    </button>
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
.collapse-chevron {
  width: 12rpx;
  height: 12rpx;
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
  min-width: 96rpx;
}
</style>

