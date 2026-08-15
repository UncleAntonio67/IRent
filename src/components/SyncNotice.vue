<template>
  <view v-if="notice" class="sync-card" :class="`sync-card-${notice.kind}`" @click="retryNow">
    <view class="sync-card-header">
      <text class="sync-card-title">{{ notice.title }}</text>
      <text class="sync-card-count">{{ notice.countText }}</text>
    </view>
    <view class="sync-card-detail">{{ notice.detail }}</view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { getPendingSyncSummary, processSyncQueue } from '../data/syncQueue.js'
import { useSyncStatus } from '../data/syncStatus.js'

const { revision, isOffline } = useSyncStatus()
const summary = computed(() => {
  void revision.value
  return getPendingSyncSummary()
})

function retryNow() {
  if (isOffline.value || !summary.value.count) return
  void processSyncQueue({ source: 'auto', force: true })
}

const notice = computed(() => {
  const nextSummary = summary.value
  if (isOffline.value) {
    return {
      kind: 'offline',
      title: '\u79bb\u7ebf\u64cd\u4f5c\u5df2\u4fdd\u5b58',
      countText: `${nextSummary.count || 0} \u6761\u5f85\u4e0a\u4f20`,
      detail: '\u6062\u590d\u7f51\u7edc\u540e\u5c06\u81ea\u52a8\u6309\u987a\u5e8f\u540c\u6b65\uff0c\u6570\u636e\u4e0d\u4f1a\u88ab\u4e91\u7aef\u8986\u76d6\u3002',
    }
  }
  // Normal online cloud-first writes remain quiet. Only show this card after
  // a real offline/failure fallback exists, so the user can see recovery
  // progress without a distracting banner on every page navigation.
  if (nextSummary.count > 0) {
    const total = Math.max(Number(nextSummary.batchTotal || 0), Number(nextSummary.count || 0))
    const completed = Math.min(Number(nextSummary.batchCompleted || 0), total)
    const current = nextSummary.isProcessing ? Math.min(completed + 1, total) : completed
    return {
      kind: 'offline',
      title: nextSummary.isProcessing ? '正在上传离线操作…' : '已联网，等待上传离线操作',
      countText: nextSummary.isProcessing ? `${current}/${total}` : `${nextSummary.count} 条待上传`,
      detail: nextSummary.isProcessing
        ? '正在按操作顺序写入云端，完成后电脑端会自动更新。'
        : '将自动重试；点击此处可立即继续上传。',
    }
  }
  return null
})
</script>

<style scoped>
.sync-card{padding:22rpx 24rpx;border-radius:24rpx;background:#fff8df;border:1rpx solid #fde68a}.sync-card-header{display:flex;align-items:center;justify-content:space-between;gap:16rpx}.sync-card-title{color:#a16207;font-size:27rpx;font-weight:700;line-height:1.4}.sync-card-count{flex-shrink:0;color:#c2410c;font-size:23rpx;font-weight:600}.sync-card-detail{margin-top:10rpx;color:#b7791f;font-size:22rpx;line-height:1.5}.sync-card-offline{background:#f8fafc;border-color:#e2e8f0}.sync-card-offline .sync-card-title,.sync-card-offline .sync-card-count,.sync-card-offline .sync-card-detail{color:#64748b}.sync-card-success{background:#ecfdf5;border-color:#bbf7d0}.sync-card-success .sync-card-title,.sync-card-success .sync-card-count,.sync-card-success .sync-card-detail{color:#047857}
</style>
