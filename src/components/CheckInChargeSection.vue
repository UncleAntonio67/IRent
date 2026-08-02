<template>
  <CollapsibleSectionCard
    title="入住收费"
    :expanded="expanded"
    title-class="text-sm text-slate-700 font-bold"
    @toggle="emit('toggle')"
  >
    <view class="stack-2">
      <view class="p-3 rounded-2xl surface-muted flex items-center justify-between gap-3">
        <view class="min-w-0 flex items-baseline gap-2">
          <view class="text-xs text-slate-500 font-bold shrink-0">本次应收</view>
          <view class="text-sm text-slate-900 font-bold truncate">￥{{ rentAmount }}</view>
        </view>
        <button class="checkin-charge-button tap-scale shrink-0" :class="rentCharged ? 'checkin-charge-button-done' : ''" @click="emit('rent-collect')">{{ rentCharged ? '已收费' : '收费' }}</button>
      </view>
      <view v-if="depositVisible" class="p-3 rounded-2xl surface-muted flex items-center justify-between gap-3">
        <view class="min-w-0 flex items-baseline gap-2">
          <view class="text-xs text-slate-500 font-bold shrink-0">押金应收</view>
          <view class="text-sm text-slate-900 font-bold truncate">￥{{ depositAmount }}</view>
        </view>
        <button class="checkin-charge-button tap-scale shrink-0" :class="depositCharged ? 'checkin-charge-button-done' : ''" @click="emit('deposit-collect')">{{ depositCharged ? '已收费' : '收费' }}</button>
      </view>
    </view>
  </CollapsibleSectionCard>
</template>

<script setup>
import CollapsibleSectionCard from './CollapsibleSectionCard.vue'

defineProps({
  expanded: { type: Boolean, default: true },
  rentAmount: { type: String, default: '0.00' },
  depositAmount: { type: String, default: '0.00' },
  depositVisible: { type: Boolean, default: false },
  rentCharged: Boolean,
  depositCharged: Boolean,
})

const emit = defineEmits(['toggle', 'rent-collect', 'deposit-collect'])
</script>

<style>
.checkin-charge-button {
  min-width: 96rpx;
  padding: 14rpx 18rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 22rpx rgba(37, 99, 235, 0.18);
}
.checkin-charge-button-done { background: #ecfdf5; color: #047857; box-shadow: none; }
</style>
