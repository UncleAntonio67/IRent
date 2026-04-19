<template>
  <BaseCenteredModal
    :open="open"
    title="修改房间信息"
    subtitle="更新租客信息、租约金额和档案资料"
    body-class="stack-3"
    @close="emit('close')"
  >
    <view class="edit-room-grid">
      <view class="edit-room-field">
        <view class="edit-room-label">租客姓名</view>
        <input :value="tenant" type="text" class="edit-room-input" placeholder="输入租客姓名" @input="emit('update:tenant', $event.detail.value)" />
      </view>
      <view class="edit-room-field">
        <view class="edit-room-label">手机号</view>
        <input :value="phone" type="text" class="edit-room-input" placeholder="输入手机号" @input="emit('update:phone', $event.detail.value)" />
      </view>
      <view class="edit-room-field">
        <view class="edit-room-label">身份证号</view>
        <input :value="idCard" type="text" class="edit-room-input" placeholder="输入身份证号" @input="emit('update:idCard', $event.detail.value)" />
      </view>
      <view class="edit-room-field">
        <view class="edit-room-label">支付周期</view>
        <input :value="paymentCycle" type="number" class="edit-room-input" placeholder="输入月数" @input="emit('update:paymentCycle', $event.detail.value)" />
      </view>
      <view class="edit-room-field">
        <view class="edit-room-label">房租</view>
        <input :value="rent" type="number" class="edit-room-input" placeholder="输入房租" @input="emit('update:rent', $event.detail.value)" />
      </view>
      <view class="edit-room-field">
        <view class="edit-room-label">押金</view>
        <input :value="deposit" type="number" class="edit-room-input" placeholder="输入押金" @input="emit('update:deposit', $event.detail.value)" />
      </view>
      <view class="edit-room-field">
        <view class="edit-room-label">租期开始</view>
        <input :value="leaseStart" type="text" class="edit-room-input" placeholder="YYYY-MM-DD" @input="emit('update:leaseStart', $event.detail.value)" />
      </view>
      <view class="edit-room-field">
        <view class="edit-room-label">租期结束</view>
        <input :value="leaseEnd" type="text" class="edit-room-input" placeholder="YYYY-MM-DD" @input="emit('update:leaseEnd', $event.detail.value)" />
      </view>
    </view>

    <view class="edit-room-attachments">
      <button class="edit-room-attachment-button tap-scale" @click="emit('pick-id-card')">
        {{ hasIdCardPic ? '更新身份证图片' : '上传身份证图片' }}
      </button>
      <button class="edit-room-attachment-button tap-scale" @click="emit('pick-contract')">
        {{ hasContract ? '更新合同图片' : '上传合同图片' }}
      </button>
    </view>

    <template #footer>
      <ActionFooterRow secondary-label="取消" primary-label="保存修改" @secondary="emit('close')" @primary="emit('confirm')" />
    </template>
  </BaseCenteredModal>
</template>

<script setup>
import ActionFooterRow from './ActionFooterRow.vue'
import BaseCenteredModal from './BaseCenteredModal.vue'

defineProps({
  open: { type: Boolean, default: false },
  tenant: { type: String, default: '' },
  phone: { type: String, default: '' },
  idCard: { type: String, default: '' },
  rent: { type: [String, Number], default: '' },
  deposit: { type: [String, Number], default: '' },
  paymentCycle: { type: [String, Number], default: '' },
  leaseStart: { type: String, default: '' },
  leaseEnd: { type: String, default: '' },
  hasIdCardPic: { type: Boolean, default: false },
  hasContract: { type: Boolean, default: false },
})

const emit = defineEmits([
  'close',
  'confirm',
  'pick-id-card',
  'pick-contract',
  'update:tenant',
  'update:phone',
  'update:idCard',
  'update:rent',
  'update:deposit',
  'update:paymentCycle',
  'update:leaseStart',
  'update:leaseEnd',
])
</script>

<style>
.edit-room-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.edit-room-field {
  padding: 18rpx;
  border-radius: 24rpx;
  background: #ffffff;
  border: 1rpx solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 10rpx 28rpx rgba(15, 23, 42, 0.05);
}

.edit-room-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #475569;
}

.edit-room-input {
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

.edit-room-attachments {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.edit-room-attachment-button {
  height: 72rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(191, 219, 254, 0.95);
  background: #eff6ff;
  color: #2563eb;
  font-size: 24rpx;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
