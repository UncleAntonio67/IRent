<template>
  <CollapsibleSectionCard
    title="附加费用"
    :expanded="expanded"
    title-class="text-sm text-slate-700 font-bold"
    @toggle="emit('toggle')"
  >
    <view class="stack-2">
      <view class="utility-config-row">
        <view class="utility-config-inline">
          <view class="utility-config-name">水费</view>
          <input
            v-if="waterChargeMode === 'separate'"
            :value="waterBase"
            type="number"
            class="checkin-input utility-inline-base-input"
            :placeholder="baseHint"
            @input="emit('update:waterBase', $event.detail.value)"
          />
          <view v-else class="utility-inline-base-disabled">底数已包含</view>
        </view>
        <view class="flex gap-2 flex-wrap">
          <button
            v-for="option in options"
            :key="`water-${option.value}`"
            class="utility-mode-button tap-scale"
            :class="waterChargeMode === option.value ? 'utility-mode-active' : 'utility-mode-default'"
            @click="emit('update:waterChargeMode', option.value)"
          >
            {{ option.label }}
          </button>
        </view>
      </view>

      <view class="utility-config-row">
        <view class="utility-config-inline">
          <view class="utility-config-name">电费</view>
          <input
            v-if="electricChargeMode === 'separate'"
            :value="electricBase"
            type="number"
            class="checkin-input utility-inline-base-input"
            :placeholder="baseHint"
            @input="emit('update:electricBase', $event.detail.value)"
          />
          <view v-else class="utility-inline-base-disabled">底数已包含</view>
        </view>
        <view class="flex gap-2 flex-wrap">
          <button
            v-for="option in options"
            :key="`electric-${option.value}`"
            class="utility-mode-button tap-scale"
            :class="electricChargeMode === option.value ? 'utility-mode-active' : 'utility-mode-default'"
            @click="emit('update:electricChargeMode', option.value)"
          >
            {{ option.label }}
          </button>
        </view>
      </view>

      <view class="utility-config-row">
        <view class="utility-config-name">燃气</view>
        <view class="flex gap-2 flex-wrap">
          <button
            v-for="option in options"
            :key="`gas-${option.value}`"
            class="utility-mode-button tap-scale"
            :class="gasChargeMode === option.value ? 'utility-mode-active' : 'utility-mode-default'"
            @click="emit('update:gasChargeMode', option.value)"
          >
            {{ option.label }}
          </button>
        </view>
      </view>

      <view class="utility-config-row">
        <view class="utility-config-name">供暖</view>
        <view class="flex gap-2 flex-wrap">
          <button
            v-for="option in options"
            :key="`heating-${option.value}`"
            class="utility-mode-button tap-scale"
            :class="heatingChargeMode === option.value ? 'utility-mode-active' : 'utility-mode-default'"
            @click="emit('update:heatingChargeMode', option.value)"
          >
            {{ option.label }}
          </button>
        </view>
      </view>
    </view>
  </CollapsibleSectionCard>
</template>

<script setup>
import CollapsibleSectionCard from './CollapsibleSectionCard.vue'

defineProps({
  expanded: { type: Boolean, default: true },
  options: { type: Array, default: () => [] },
  waterChargeMode: { type: String, default: 'separate' },
  electricChargeMode: { type: String, default: 'separate' },
  gasChargeMode: { type: String, default: 'separate' },
  heatingChargeMode: { type: String, default: 'separate' },
  waterBase: { type: String, default: '' },
  electricBase: { type: String, default: '' },
  baseHint: { type: String, default: '填入底数' },
})

const emit = defineEmits([
  'toggle',
  'update:waterChargeMode',
  'update:electricChargeMode',
  'update:gasChargeMode',
  'update:heatingChargeMode',
  'update:waterBase',
  'update:electricBase',
])
</script>

<style>
.utility-config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  flex-wrap: nowrap;
}

.utility-config-name {
  min-width: 72rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #334155;
}

.utility-config-inline {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.utility-inline-base-input {
  width: 168rpx;
  height: 60rpx;
  margin-top: 0;
  padding: 0 14rpx;
  border-radius: 16rpx;
  line-height: 60rpx;
  font-size: 28rpx;
}

.utility-inline-base-disabled {
  width: 168rpx;
  height: 60rpx;
  padding: 0 14rpx;
  border-radius: 16rpx;
  background: #f8fafc;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  color: #94a3b8;
  line-height: 60rpx;
  text-align: center;
  box-sizing: border-box;
  font-size: 24rpx;
}

.utility-mode-button {
  min-width: 124rpx;
  padding: 12rpx 16rpx;
  border-radius: 16rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1;
}

.utility-mode-default {
  background: #fff;
  color: #475569;
}

.utility-mode-active {
  background: #eff6ff;
  color: #2563eb;
  border-color: rgba(191, 219, 254, 0.95);
}
</style>
