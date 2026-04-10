<template>
  <view v-if="open" class="absolute inset-0 z-50 flex items-end">
    <view class="absolute inset-0 bg-slate-900-45" @click="emitClose"></view>
    <view class="relative inset-x-0 bottom-0 w-full">
      <view class="w-full bg-white rounded-t-3xl shadow-top-soft flex flex-col overflow-hidden border-t border-slate-200-60" :style="{ maxHeight: panelMaxHeight + 'px' }" @click.stop>
        <view class="px-5 pt-4 pb-3 border-b border-slate-200-60">
          <view class="flex justify-center">
            <view class="w-10 h-1_5 rounded-full bg-slate-200"></view>
          </view>
          <view class="flex items-start justify-between gap-3 mt-3">
            <view class="min-w-0">
              <view class="text-lg font-black text-slate-800 truncate">{{ title }}</view>
              <view v-if="subtitle" class="text-xs text-slate-400 mt-1">{{ subtitle }}</view>
            </view>
            <button class="drawer-icon-button" @click="emitClose">
              <view class="icon-close">
                <view class="icon-close-line"></view>
                <view class="icon-close-line icon-close-line-second"></view>
              </view>
            </button>
          </view>
        </view>

        <scroll-view scroll-y class="flex-1" :style="{ maxHeight: contentMaxHeight + 'px' }" enable-flex>
          <view class="p-5">
            <slot />
          </view>
        </scroll-view>

        <view v-if="$slots.footer" class="px-5 pb-4 pt-2 border-t border-slate-200-60 bg-white">
          <slot name="footer" />
          <view :style="{ height: safeAreaBottom + 'px' }"></view>
        </view>
        <view v-else :style="{ height: safeAreaBottom + 'px' }"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})

const emit = defineEmits(['close'])
const safeAreaBottom = ref(0)
const panelMaxHeight = ref(560)
const contentMaxHeight = ref(420)

function emitClose() {
  emit('close')
}

onMounted(() => {
  try {
    const sys = uni.getSystemInfoSync()
    safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
    const windowHeight = Number(sys.windowHeight || 700)
    panelMaxHeight.value = Math.max(420, Math.floor(windowHeight * 0.78))
    contentMaxHeight.value = Math.max(240, panelMaxHeight.value - 146 - safeAreaBottom.value)
  } catch {
    safeAreaBottom.value = 0
    panelMaxHeight.value = 560
    contentMaxHeight.value = 420
  }
})
</script>
