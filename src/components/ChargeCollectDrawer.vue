<template>
  <BaseCenteredModal :open="open" :title="title" :subtitle="subtitle" body-class="stack-3" @close="emit('close')">
    <view class="charge-drawer-hero" :class="heroToneClass">
      <view class="charge-drawer-hero-top">
        <view class="charge-drawer-hero-label">{{ heroLabel }}</view>
        <view class="charge-drawer-hero-badge">{{ heroBadge }}</view>
      </view>
      <view class="charge-drawer-hero-amount">&#165;{{ heroAmount }}</view>
      <view class="charge-drawer-hero-bottom">
        <view>
          <view class="charge-drawer-hero-sub-label">{{ leftLabel }}</view>
          <view class="charge-drawer-hero-sub-value">{{ leftValue }}</view>
        </view>
        <view class="text-right">
          <view class="charge-drawer-hero-sub-label">{{ rightLabel }}</view>
          <view class="charge-drawer-hero-sub-value">{{ rightValue }}</view>
        </view>
      </view>
    </view>

    <view class="charge-drawer-section">
      <view class="charge-drawer-label">{{ inputLabel }}</view>
      <view class="charge-drawer-entry-row">
        <view class="charge-drawer-input-wrap charge-drawer-input-grow">
          <view class="charge-drawer-currency">&#165;</view>
          <input
            :value="modelValue"
            type="number"
            class="charge-drawer-input"
            :placeholder="placeholder"
            @input="emit('update:modelValue', $event.detail.value)"
          />
        </view>
        <button
          class="charge-drawer-upload-button tap-scale"
          :class="receiptPicked ? 'charge-drawer-upload-button-done' : ''"
          @click="emit('pick-receipt')"
        >
          {{ receiptPicked ? '已上传' : '上传凭证' }}
        </button>
      </view>
      <view class="charge-drawer-inline-status" :class="receiptPicked ? 'charge-drawer-inline-status-done' : ''">
        {{ receiptPicked ? receiptFileName : receiptPendingText }}
      </view>
      <view v-if="helperText" class="charge-drawer-helper">{{ helperText }}</view>
    </view>

    <template #footer>
      <ActionFooterRow
        secondary-label="取消"
        :primary-label="confirmLabel"
        :primary-disabled="confirmDisabled"
        @secondary="emit('close')"
        @primary="emit('confirm')"
      >
        <template #primarySuffix>
          <text v-if="confirmBadge" class="charge-drawer-confirm-badge">{{ confirmBadge }}</text>
        </template>
      </ActionFooterRow>
    </template>
  </BaseCenteredModal>
</template>

<script setup>
import { computed } from 'vue'
import ActionFooterRow from './ActionFooterRow.vue'
import BaseCenteredModal from './BaseCenteredModal.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  heroLabel: { type: String, default: '应收总额' },
  heroBadge: { type: String, default: '待收费' },
  heroAmount: { type: [String, Number], default: '' },
  leftLabel: { type: String, default: '已收金额' },
  leftValue: { type: String, default: '' },
  rightLabel: { type: String, default: '本次待收' },
  rightValue: { type: String, default: '' },
  inputLabel: { type: String, default: '本次实收金额' },
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '0.00' },
  receiptPicked: { type: Boolean, default: false },
  receiptFileName: { type: String, default: 'receipt_mock_001.jpg' },
  receiptPendingText: { type: String, default: '支持 JPG、PNG 或 PDF' },
  confirmLabel: { type: String, default: '确认收款' },
  confirmDisabled: { type: Boolean, default: false },
  confirmBadge: { type: String, default: '' },
  helperText: { type: String, default: '' },
  heroTone: { type: String, default: 'blue' },
})

const emit = defineEmits(['close', 'confirm', 'pick-receipt', 'update:modelValue'])
const heroToneClass = computed(() => (props.heroTone === 'amber' ? 'charge-drawer-hero-amber' : 'charge-drawer-hero-blue'))
</script>

<style>
.charge-drawer-hero {
  padding: 24rpx;
  border-radius: 24rpx;
  color: #ffffff;
  position: relative;
  overflow: hidden;
}

.charge-drawer-hero-blue {
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  box-shadow: 0 18rpx 36rpx rgba(59, 130, 246, 0.18);
}

.charge-drawer-hero-amber {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  box-shadow: 0 18rpx 36rpx rgba(249, 115, 22, 0.18);
}

.charge-drawer-hero::after {
  content: '';
  position: absolute;
  right: -28rpx;
  bottom: -28rpx;
  width: 140rpx;
  height: 140rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.1);
  filter: blur(6rpx);
}

.charge-drawer-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  position: relative;
  z-index: 1;
}

.charge-drawer-hero-label {
  font-size: 20rpx;
  font-weight: 700;
  color: rgba(219, 234, 254, 0.95);
}

.charge-drawer-hero-badge {
  padding: 6rpx 14rpx;
  border-radius: 12rpx;
  font-size: 16rpx;
  font-weight: 700;
  color: #eff6ff;
  background: rgba(255, 255, 255, 0.18);
}

.charge-drawer-hero-amount {
  margin-top: 14rpx;
  font-size: 46rpx;
  line-height: 1;
  font-weight: 900;
  position: relative;
  z-index: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
}

.charge-drawer-hero-bottom {
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  position: relative;
  z-index: 1;
}

.charge-drawer-hero-sub-label {
  font-size: 16rpx;
  color: rgba(219, 234, 254, 0.92);
}

.charge-drawer-hero-sub-value {
  margin-top: 6rpx;
  font-size: 24rpx;
  font-weight: 800;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
}

.charge-drawer-section {
  padding: 22rpx;
  border-radius: 24rpx;
  background: #ffffff;
  border: 1rpx solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 10rpx 28rpx rgba(15, 23, 42, 0.05);
}

.charge-drawer-label {
  font-size: 24rpx;
  font-weight: 800;
  color: #334155;
}

.charge-drawer-entry-row {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.charge-drawer-input-wrap {
  position: relative;
}

.charge-drawer-input-grow {
  flex: 1;
}

.charge-drawer-currency {
  position: absolute;
  left: 22rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 30rpx;
  font-weight: 800;
  color: #94a3b8;
  z-index: 1;
}

.charge-drawer-input {
  width: 100%;
  height: 76rpx;
  padding: 0 20rpx 0 50rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.95);
  background: #f8fafc;
  font-size: 32rpx;
  line-height: 76rpx;
  font-weight: 600;
  color: #0f172a;
  box-sizing: border-box;
}

.charge-drawer-upload-button {
  min-width: 126rpx;
  height: 76rpx;
  padding: 0 18rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(191, 219, 254, 0.95);
  background: #eff6ff;
  color: #2563eb;
  font-size: 24rpx;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.charge-drawer-upload-button-done {
  border-color: rgba(167, 243, 208, 0.95);
  background: #ecfdf5;
  color: #047857;
}

.charge-drawer-inline-status {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #94a3b8;
}

.charge-drawer-inline-status-done {
  color: #047857;
}

.charge-drawer-helper {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #94a3b8;
}

.charge-drawer-confirm-badge {
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.18);
  font-size: 18rpx;
  font-weight: 700;
}
</style>
