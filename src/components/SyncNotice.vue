<template>
  <view v-if="notice" class="sync-notice" :class="`sync-notice-${notice.kind}`">
    <text class="sync-notice-dot">{{ notice.kind === 'offline' ? '○' : '!' }}</text>
    <view class="sync-notice-content">
      <view class="sync-notice-title">{{ notice.title }}</view>
      <view v-if="notice.detail" class="sync-notice-detail">{{ notice.detail }}</view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { getPendingSyncSummary } from '../data/syncQueue.js'
import { useSyncStatus } from '../data/syncStatus.js'

const { revision, isOffline } = useSyncStatus()

const notice = computed(() => {
  // Depend on the reactive revision. Normal pending work is intentionally
  // silent: only offline or a retry-worthy failure should interrupt the UI.
  void revision.value
  const summary = getPendingSyncSummary()
  if (isOffline.value) {
    return {
      kind: 'offline',
      title: summary.count ? `当前离线，已暂存 ${summary.count} 条操作` : '当前离线',
      detail: summary.count ? '恢复网络后将自动同步。' : '联网后将自动恢复云端数据。',
    }
  }
  if (summary.failedCount > 0 || summary.lastError) {
    return {
      kind: 'retry',
      title: `有 ${Math.max(summary.failedCount, summary.count, 1)} 条操作暂未同步`,
      detail: '正在自动重试；请保持网络连接。',
    }
  }
  return null
})
</script>

<style scoped>
.sync-notice { display:flex; align-items:flex-start; gap:12rpx; padding:18rpx 22rpx; border-radius:18rpx; border:1rpx solid; }
.sync-notice-offline { color:#475569; background:#f8fafc; border-color:#e2e8f0; }
.sync-notice-retry { color:#b45309; background:#fffbeb; border-color:#fde68a; }
.sync-notice-dot { width:28rpx; flex-shrink:0; font-size:28rpx; font-weight:800; line-height:1.35; text-align:center; }
.sync-notice-content { min-width:0; }
.sync-notice-title { font-size:24rpx; font-weight:700; line-height:1.4; }
.sync-notice-detail { margin-top:4rpx; font-size:21rpx; line-height:1.4; opacity:.85; }
</style>
