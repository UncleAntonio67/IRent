<template>
  <CollapsibleSectionCard
    title="当前租客"
    :expanded="expanded"
    title-class="text-sm text-slate-700 font-bold"
    body-class="flex items-end justify-between gap-2 mt-2"
    @toggle="emit('toggle')"
  >
    <view class="tenant-edit-fields min-w-0 flex-1">
      <input
        :value="tenant"
        type="text"
        class="tenant-inline-input"
        placeholder="请输入租客姓名"
        @input="emit('update:tenant', $event.detail.value)"
      />
      <input
        :value="phone"
        type="text"
        class="tenant-inline-input mt-2"
        placeholder="请输入手机号"
        @input="emit('update:phone', $event.detail.value)"
      />
    </view>
    <view class="tenant-attachment-row">
      <view class="tenant-attachment-group">
        <button class="detail-side-button tap-scale" :class="idCardCount ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'" @click="idCardCount ? emit('preview-id-card') : emit('pick-id-card')">
          <view class="detail-side-button-text" :class="idCardCount ? 'text-emerald-800' : 'text-slate-700'">{{ idCardCount ? '身份证已上传' : '上传身份证' }}</view>
        </button>
        <button v-if="canManage && idCardCount" class="tenant-attachment-delete" @click.stop="emit('remove-id-card', idCardCount - 1)">×</button>
      </view>
      <view class="tenant-attachment-group">
        <button class="detail-side-button tap-scale" :class="contractCount ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'" @click="contractCount ? emit('preview-contract') : emit('pick-contract')">
          <view class="detail-side-button-text" :class="contractCount ? 'text-emerald-800' : 'text-slate-700'">{{ contractCount ? '合同已上传' : '上传合同' }}</view>
        </button>
        <button v-if="canManage && contractCount" class="tenant-attachment-delete" @click.stop="emit('remove-contract', contractCount - 1)">×</button>
      </view>
    </view>
  </CollapsibleSectionCard>
</template>

<script setup>
import { computed } from 'vue'
import CollapsibleSectionCard from './CollapsibleSectionCard.vue'

const props = defineProps({
  expanded: { type: Boolean, default: true },
  tenant: { type: String, default: '' },
  phone: { type: String, default: '' },
  idCards: { type: Array, default: () => [] },
  contracts: { type: Array, default: () => [] },
  canManage: { type: Boolean, default: false },
})

const idCardCount = computed(() => props.idCards.length)
const contractCount = computed(() => props.contracts.length)
const emit = defineEmits(['toggle', 'update:tenant', 'update:phone', 'pick-id-card', 'pick-contract', 'preview-id-card', 'preview-contract', 'remove-id-card', 'remove-contract'])
</script>

<style>
.tenant-inline-input {
  width: 100%;
  min-height: 36rpx;
  padding: 6rpx 0;
  background: transparent;
  border: 0;
  box-sizing: border-box;
  line-height: 1.4;
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 500;
}

.tenant-inline-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.detail-side-button {
  min-width: 112rpx;
  padding: 16rpx 14rpx;
  border-radius: 14rpx;
  border-width: 1rpx;
  text-align: center;
  flex-shrink: 0;
}

.detail-side-button-text {
  font-size: 24rpx;
  line-height: 1.15;
  font-weight: 600;
}

.tenant-attachment-row { display: flex; gap: 10rpx; flex-shrink: 0; }

.tenant-attachment-group { min-width: 0; position: relative; }

.tenant-attachment-group .detail-side-button {
  min-width: 128rpx;
}

.tenant-attachment-delete {
  position: absolute;
  z-index: 2;
  top: -10rpx;
  right: -8rpx;
  width: 30rpx;
  height: 30rpx;
  min-width: 30rpx;
  padding: 0;
  border-radius: 50%;
  color: #fff;
  background: #64748b;
  font-size: 26rpx;
  line-height: 28rpx;
}

</style>
