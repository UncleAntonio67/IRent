<template>
  <CollapsibleSectionCard
    title="当前租客"
    :expanded="expanded"
    title-class="text-sm text-slate-700 font-bold"
    body-class="flex items-end justify-between gap-2 mt-3"
    @toggle="emit('toggle')"
  >
    <view class="min-w-0 flex-1">
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
    <button
      v-if="idCard || canManage"
      class="detail-side-button tap-scale"
      :class="idCard ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'"
      @click="emit('pick-id-card')"
    >
      <view class="detail-side-button-text" :class="idCard ? 'text-emerald-800' : 'text-slate-700'">
        {{ idCard ? '查看身份证' : '上传身份证' }}
      </view>
    </button>
    <button
      v-if="contract || canManage"
      class="detail-side-button tap-scale"
      :class="contract ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'"
      @click="emit('pick-contract')"
    >
      <view class="detail-side-button-text" :class="contract ? 'text-emerald-800' : 'text-slate-700'">
        {{ contract ? '查看合同' : '上传合同' }}
      </view>
    </button>
  </CollapsibleSectionCard>
</template>

<script setup>
import CollapsibleSectionCard from './CollapsibleSectionCard.vue'

defineProps({
  expanded: { type: Boolean, default: true },
  tenant: { type: String, default: '' },
  phone: { type: String, default: '' },
  idCard: { type: Object, default: null },
  contract: { type: Object, default: null },
  canManage: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'update:tenant', 'update:phone', 'pick-id-card', 'pick-contract'])
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
</style>
