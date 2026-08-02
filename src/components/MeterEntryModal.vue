<template>
  <BaseCenteredModal :open="open" :title="title" :subtitle="subtitle" @close="emit('close')">
    <view class="meter-entry-list">
      <view class="meter-entry-row">
        <view class="meter-entry-label">水表读数</view>
        <input :value="water" type="number" class="meter-entry-input" placeholder="输入读数" @input="emit('update:water', $event.detail.value)" />
        <button class="meter-upload-button tap-scale" :class="waterPhotoPicked ? 'meter-upload-button-done' : ''" @click="emit('pick-water-photo')">{{ waterPhotoPicked ? '已上传' : '照片' }}</button>
      </view>
      <view class="meter-entry-row">
        <view class="meter-entry-label">电表读数</view>
        <input :value="electric" type="number" class="meter-entry-input" placeholder="输入读数" @input="emit('update:electric', $event.detail.value)" />
        <button class="meter-upload-button tap-scale" :class="electricPhotoPicked ? 'meter-upload-button-done' : ''" @click="emit('pick-electric-photo')">{{ electricPhotoPicked ? '已上传' : '照片' }}</button>
      </view>
    </view>
    <template #footer>
      <ActionFooterRow :show-secondary="false" primary-label="生成应收费用" primary-class="meter-footer-primary" @primary="emit('confirm')" />
    </template>
  </BaseCenteredModal>
</template>

<script setup>
import ActionFooterRow from './ActionFooterRow.vue'
import BaseCenteredModal from './BaseCenteredModal.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '录入水电表' },
  subtitle: { type: String, default: '输入本期水表、电表读数，可分别上传照片。' },
  water: { type: [String, Number], default: '' },
  electric: { type: [String, Number], default: '' },
  waterPhotoPicked: { type: Boolean, default: false },
  electricPhotoPicked: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm', 'update:water', 'update:electric', 'pick-water-photo', 'pick-electric-photo'])
</script>

<style>
.meter-entry-list { overflow: hidden; border-radius: 20rpx; background: #f8fafc; }
.meter-entry-row { min-height: 100rpx; padding: 0 18rpx; display: flex; align-items: center; gap: 14rpx; border-bottom: 1rpx solid #e2e8f0; }
.meter-entry-row:last-child { border-bottom: 0; }
.meter-entry-label { width: 112rpx; font-size: 25rpx; font-weight: 600; color: #475569; flex-shrink: 0; }
.meter-entry-input { flex: 1; min-width: 0; height: 64rpx; padding: 0 12rpx; border: 0; border-radius: 14rpx; background: #ffffff; font-size: 28rpx; line-height: 64rpx; font-weight: 600; color: #0f172a; box-sizing: border-box; }
.meter-upload-button { width: 78rpx; height: 54rpx; padding: 0; border-radius: 14rpx; background: #eff6ff; color: #2563eb; font-size: 20rpx; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.meter-upload-button-done { border-color: rgba(167, 243, 208, 0.95); background: #ecfdf5; color: #047857; }
.meter-footer-primary { background: linear-gradient(135deg, #f59e0b, #f59e0b); box-shadow: 0 16rpx 28rpx rgba(245, 158, 11, 0.18); }
</style>
