<template>
  <view v-if="notice" class="sync-card" :class="`sync-card-${notice.kind}`">
    <view class="sync-card-header">
      <view class="sync-card-title-wrap">
        <view class="sync-card-status-dot" :class="`sync-card-status-dot-${notice.kind}`"></view>
        <text class="sync-card-title">{{ notice.title }}</text>
      </view>
      <text class="sync-card-count">{{ notice.countText }}</text>
    </view>
    <view class="sync-card-detail">{{ notice.detail }}</view>
  </view>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { getPendingSyncSummary } from '../data/syncQueue.js'
import { useSyncStatus } from '../data/syncStatus.js'

const { revision, isOffline } = useSyncStatus()
const showPending = ref(false)
const showSuccess = ref(false)
let pendingTimer = null
let successTimer = null
let previousPendingCount = 0

const summary = computed(() => {
  void revision.value
  return getPendingSyncSummary()
})

// Fast online writes normally finish in a fraction of a second. Delaying the
// card avoids a distracting flash on every page navigation or tap.
watch([summary, isOffline], ([nextSummary, offline]) => {
  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = null
  if (offline || nextSummary.failedCount > 0 || nextSummary.lastError) {
    showPending.value = true
    return
  }
  if (!nextSummary.count) {
    if (previousPendingCount > 0 && showPending.value && !offline && Number(nextSummary.lastSuccessAt || 0) > 0) {
      showSuccess.value = true
      if (successTimer) clearTimeout(successTimer)
      successTimer = setTimeout(() => { showSuccess.value = false }, 3500)
    }
    showPending.value = false
    previousPendingCount = 0
    return
  }
  previousPendingCount = nextSummary.count
  pendingTimer = setTimeout(() => { showPending.value = true }, 700)
}, { immediate: true })

onUnmounted(() => { if (pendingTimer) clearTimeout(pendingTimer); if (successTimer) clearTimeout(successTimer) })

const notice = computed(() => {
  const nextSummary = summary.value
  if (isOffline.value) {
    return {
      kind: 'offline',
      title: nextSummary.count ? '离线操作已暂存' : '当前处于离线状态',
      countText: nextSummary.count ? `${nextSummary.count} 条待同步` : '等待网络恢复',
      detail: nextSummary.count ? '恢复网络后将按操作顺序自动同步到云端。' : '联网后将自动刷新云端数据。',
    }
  }
  if (showSuccess.value && !nextSummary.count) {
    return {
      kind: 'success',
      title: '离线操作已同步',
      countText: '云端已更新',
      detail: '本机保存的操作已按顺序提交完成，可在其他设备查看。',
    }
  }
  if (!showPending.value || !nextSummary.count) return null
  const retryCount = Math.max(0, Number(nextSummary.failedCount || 0))
  return {
    kind: retryCount > 0 || nextSummary.lastError ? 'retry' : 'syncing',
    title: retryCount > 0 ? '部分操作暂未同步' : '正在同步操作',
    countText: retryCount > 0 ? `重试 ${retryCount} 条 / 共 ${nextSummary.count} 条` : `${nextSummary.count} 条待完成`,
    detail: retryCount > 0 ? '请保持网络连接，系统将自动重试并更新云端数据。' : '操作已保存，正在提交至云端。',
  }
})
</script>

<style scoped>
.sync-card { padding:24rpx; border-radius:24rpx; background:#fffbeb; box-shadow:none; border:1rpx solid #fef3c7; }
.sync-card-header { display:flex; align-items:center; justify-content:space-between; gap:16rpx; }
.sync-card-title-wrap { display:flex; align-items:center; min-width:0; gap:12rpx; }
.sync-card-status-dot { width:14rpx; height:14rpx; border-radius:999rpx; flex-shrink:0; }
.sync-card-status-dot-syncing { background:#2563eb; box-shadow:0 0 0 6rpx rgba(37,99,235,.10); }
.sync-card-status-dot-retry { background:#f59e0b; box-shadow:0 0 0 6rpx rgba(245,158,11,.12); }
.sync-card-status-dot-offline { background:#94a3b8; box-shadow:0 0 0 6rpx rgba(148,163,184,.12); }
.sync-card-title { overflow:hidden; color:#b45309; font-size:26rpx; font-weight:700; line-height:1.35; white-space:nowrap; text-overflow:ellipsis; }
.sync-card-count { flex-shrink:0; color:#c2410c; font-size:22rpx; font-weight:600; line-height:1.35; }
.sync-card-detail { margin-top:12rpx; color:#b7791f; font-size:22rpx; line-height:1.5; }
.sync-card-syncing { background:#fffbeb; border-color:#fef3c7; }
.sync-card-retry { background:#fff8df; border-color:#fde68a; }
.sync-card-offline { background:#fff8df; border-color:#fde68a; }
.sync-card-offline .sync-card-title { color:#a16207; }
.sync-card-success { background:#ecfdf5; border-color:#bbf7d0; }
.sync-card-status-dot-success { background:#10b981; box-shadow:0 0 0 6rpx rgba(16,185,129,.12); }
.sync-card-success .sync-card-title { color:#047857; }
.sync-card-success .sync-card-count,.sync-card-success .sync-card-detail { color:#059669; }
</style>
