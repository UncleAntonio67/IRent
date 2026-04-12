<template>
  <BaseCenteredModal :open="open" :title="title" :subtitle="subtitle" @close="emit('close')">
    <view class="meter-entry-grid">
      <view class="meter-entry-card">
        <view class="meter-entry-label">水表</view>
        <input :value="water" type="number" class="meter-entry-input" placeholder="输入读数" @input="emit('update:water', $event.detail.value)" />
        <view class="meter-entry-actions">
          <button class="meter-upload-button tap-scale" :class="waterPhotoPicked ? 'meter-upload-button-done' : ''" @click="emit('pick-water-photo')">
            {{ waterPhotoPicked ? '已上传' : '上传照片' }}
          </button>
        </view>
      </view>

      <view class="meter-entry-card">
        <view class="meter-entry-label">电表</view>
        <input :value="electric" type="number" class="meter-entry-input" placeholder="输入读数" @input="emit('update:electric', $event.detail.value)" />
        <view class="meter-entry-actions">
          <button class="meter-upload-button tap-scale" :class="electricPhotoPicked ? 'meter-upload-button-done' : ''" @click="emit('pick-electric-photo')">
            {{ electricPhotoPicked ? '已上传' : '上传照片' }}
          </button>
        </view>
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
  subtitle: { type: String, default: '' },
  water: { type: [String, Number], default: '' },
  electric: { type: [String, Number], default: '' },
  waterPhotoPicked: { type: Boolean, default: false },
  electricPhotoPicked: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm', 'update:water', 'update:electric', 'pick-water-photo', 'pick-electric-photo'])
</script>

<style>
.meter-entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.meter-entry-card {
  padding: 18rpx;
  border-radius: 24rpx;
  background: #ffffff;
  border: 1rpx solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 10rpx 28rpx rgba(15, 23, 42, 0.05);
}

.meter-entry-label {
  font-size: 24rpx;
  font-weight: 800;
  color: #334155;
}

.meter-entry-input {
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

.meter-entry-actions {
  margin-top: 12rpx;
}

.meter-upload-button {
  width: 100%;
  height: 58rpx;
  border-radius: 18rpx;
  border: 1rpx solid rgba(191, 219, 254, 0.95);
  background: #eff6ff;
  color: #2563eb;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meter-upload-button-done {
  border-color: rgba(167, 243, 208, 0.95);
  background: #ecfdf5;
  color: #047857;
}

.meter-footer-primary {
  background: linear-gradient(135deg, #f59e0b, #f59e0b);
  box-shadow: 0 16rpx 28rpx rgba(245, 158, 11, 0.18);
}
</style>
