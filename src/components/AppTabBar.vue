<template>
  <view class="app-tabbar-wrap">
    <view class="app-tabbar-shell">
      <view
        v-for="item in items"
        :key="item.pagePath"
        class="app-tabbar-item"
        @click="switchTo(item)"
      >
        <view class="app-tabbar-pill" :class="{ active: current === item.key }">
          <view class="app-tabbar-icon" :class="[item.key, current === item.key ? 'active' : '']">
            <view v-if="item.key === 'workbench'" class="icon-building">
              <view class="building-frame"></view>
              <view class="building-door"></view>
              <view class="building-window window-left"></view>
              <view class="building-window window-right"></view>
            </view>
            <view v-else-if="item.key === 'bills'" class="icon-receipt">
              <view class="receipt-sheet"></view>
              <view class="receipt-line line-1"></view>
              <view class="receipt-line line-2"></view>
              <view class="receipt-line line-3"></view>
            </view>
            <view v-else class="icon-user">
              <view class="user-outline-head"></view>
              <view class="user-outline-body"></view>
            </view>
          </view>
          <text class="app-tabbar-label">{{ item.text }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  current: {
    type: String,
    required: true,
  },
})

const items = [
  { key: 'workbench', text: '\u5de5\u4f5c\u53f0', pagePath: '/pages/workbench/index' },
  { key: 'bills', text: '\u8d26\u52a1', pagePath: '/pages/bills/index' },
  { key: 'profile', text: '\u6211\u7684', pagePath: '/pages/profile/index' },
]

function switchTo(item) {
  if (props.current === item.key) return
  uni.redirectTo({ url: item.pagePath })
}
</script>

<style>
.app-tabbar-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid rgba(226, 232, 240, 0.96);
  box-shadow: 0 -8rpx 24rpx rgba(15, 23, 42, 0.06);
  padding-bottom: env(safe-area-inset-bottom);
}

.app-tabbar-shell {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 10rpx 12rpx 8rpx;
}

.app-tabbar-item {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.app-tabbar-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  width: 100%;
  padding: 10rpx 6rpx 8rpx;
  border-radius: 20rpx;
}

.app-tabbar-pill.active {
  background: rgba(239, 246, 255, 0.92);
}

.app-tabbar-icon {
  width: 44rpx;
  height: 44rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
}

.app-tabbar-icon.active {
  background: rgba(255, 255, 255, 0.9);
}

.app-tabbar-label {
  font-size: 20rpx;
  line-height: 24rpx;
  color: #94a3b8;
  font-weight: 800;
  letter-spacing: 0;
}

.app-tabbar-pill.active .app-tabbar-label {
  color: #2563eb;
}

.icon-building,
.icon-receipt,
.icon-user {
  position: relative;
  width: 28rpx;
  height: 28rpx;
}

.building-frame {
  position: absolute;
  left: 5rpx;
  top: 4rpx;
  width: 18rpx;
  height: 20rpx;
  border: 2rpx solid #94a3b8;
  border-radius: 5rpx;
  box-sizing: border-box;
}

.building-door {
  position: absolute;
  left: 11rpx;
  bottom: 4rpx;
  width: 6rpx;
  height: 8rpx;
  border-radius: 2rpx 2rpx 0 0;
  background: #94a3b8;
}

.building-window {
  position: absolute;
  top: 9rpx;
  width: 4rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: #94a3b8;
}

.window-left {
  left: 9rpx;
}

.window-right {
  right: 9rpx;
}

.app-tabbar-icon.workbench.active .building-frame {
  border-color: #2563eb;
}

.app-tabbar-icon.workbench.active .building-door,
.app-tabbar-icon.workbench.active .building-window {
  background: #2563eb;
}

.receipt-sheet {
  position: absolute;
  left: 6rpx;
  top: 3rpx;
  width: 18rpx;
  height: 24rpx;
  border: 2rpx solid #94a3b8;
  border-radius: 5rpx;
  box-sizing: border-box;
}

.receipt-line {
  position: absolute;
  left: 10rpx;
  height: 2rpx;
  border-radius: 999rpx;
  background: #94a3b8;
}

.line-1 {
  top: 9rpx;
  width: 8rpx;
}

.line-2 {
  top: 14rpx;
  width: 10rpx;
}

.line-3 {
  top: 19rpx;
  width: 7rpx;
}

.app-tabbar-icon.bills.active .receipt-sheet {
  border-color: #2563eb;
}

.app-tabbar-icon.bills.active .receipt-line {
  background: #2563eb;
}

.user-outline-head {
  position: absolute;
  left: 8rpx;
  top: 2rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 999rpx;
  border: 2rpx solid #94a3b8;
  box-sizing: border-box;
}

.user-outline-body {
  position: absolute;
  left: 4rpx;
  top: 16rpx;
  width: 20rpx;
  height: 10rpx;
  border: 2rpx solid #94a3b8;
  border-bottom: none;
  border-radius: 12rpx 12rpx 0 0;
  box-sizing: border-box;
}

.app-tabbar-icon.profile.active .user-outline-head,
.app-tabbar-icon.profile.active .user-outline-body {
  border-color: #2563eb;
}
</style>
