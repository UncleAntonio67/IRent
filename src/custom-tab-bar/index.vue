<template>
  <view class="custom-tabbar-wrap">
    <view class="custom-tabbar-shell">
      <view
        v-for="item in tabs"
        :key="item.pagePath"
        class="tab-item"
        :class="{ active: selected === item.pagePath }"
        @click="switchTo(item)"
      >
        <view class="tab-pill" :class="{ active: selected === item.pagePath }">
          <view class="tab-icon" :class="[`icon-${item.key}`, selected === item.pagePath ? 'active' : '']">
            <view v-if="item.key === 'workbench'" class="icon-building">
              <view class="building-top"></view>
              <view class="building-main"></view>
            </view>
            <view v-else-if="item.key === 'bills'" class="icon-receipt">
              <view class="receipt-body"></view>
              <view class="receipt-line line-1"></view>
              <view class="receipt-line line-2"></view>
              <view class="receipt-line line-3"></view>
            </view>
            <view v-else class="icon-user">
              <view class="user-head"></view>
              <view class="user-body"></view>
            </view>
          </view>
          <text class="tab-label">{{ item.text }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      selected: 'pages/workbench/index',
      tabs: [
        { key: 'workbench', text: '\u5de5\u4f5c\u53f0', pagePath: 'pages/workbench/index' },
        { key: 'bills', text: '\u8d26\u52a1', pagePath: 'pages/bills/index' },
        { key: 'profile', text: '\u6211\u7684', pagePath: 'pages/profile/index' },
      ],
    }
  },
  mounted() {
    this.syncSelected()
  },
  pageLifetimes: {
    show() {
      this.syncSelected()
    },
  },
  methods: {
    syncSelected() {
      const pages = getCurrentPages()
      if (!pages.length) return
      const current = pages[pages.length - 1]
      this.selected = current.route || 'pages/workbench/index'
    },
    switchTo(item) {
      if (this.selected === item.pagePath) return
      this.selected = item.pagePath
      uni.switchTab({
        url: `/${item.pagePath}`,
      })
    },
  },
}
</script>

<style>
.custom-tabbar-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 998;
  display: flex;
  justify-content: center;
  pointer-events: none;
  padding: 0 18rpx calc(env(safe-area-inset-bottom) + 18rpx);
}

.custom-tabbar-shell {
  width: 88%;
  max-width: 680rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx;
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 12rpx 40rpx rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(20rpx);
  pointer-events: auto;
}

.tab-item {
  flex: 1;
  min-width: 0;
}

.tab-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 8rpx 10rpx;
  border-radius: 26rpx;
}

.tab-pill.active {
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.98) 0%, rgba(219, 234, 254, 0.9) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.88);
}

.tab-icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.tab-icon.active {
  background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
  border-color: #bfdbfe;
}

.tab-label {
  font-size: 20rpx;
  line-height: 28rpx;
  color: #94a3b8;
  font-weight: 700;
}

.tab-pill.active .tab-label {
  color: #2563eb;
}

.icon-building,
.icon-receipt,
.icon-user {
  position: relative;
  width: 28rpx;
  height: 28rpx;
}

.building-top {
  position: absolute;
  left: 5rpx;
  top: 2rpx;
  width: 18rpx;
  height: 6rpx;
  border-radius: 6rpx 6rpx 2rpx 2rpx;
  background: #94a3b8;
}

.building-main {
  position: absolute;
  left: 4rpx;
  top: 9rpx;
  width: 20rpx;
  height: 16rpx;
  border-radius: 5rpx;
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

.icon-workbench.active .building-top,
.icon-workbench.active .building-main {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
}

.receipt-body {
  position: absolute;
  left: 5rpx;
  top: 2rpx;
  width: 18rpx;
  height: 24rpx;
  border-radius: 6rpx;
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

.receipt-line {
  position: absolute;
  left: 9rpx;
  height: 2rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
}

.line-1 {
  top: 8rpx;
  width: 10rpx;
}

.line-2 {
  top: 13rpx;
  width: 8rpx;
}

.line-3 {
  top: 18rpx;
  width: 12rpx;
}

.icon-bills.active .receipt-body {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
}

.user-head {
  position: absolute;
  left: 8rpx;
  top: 2rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

.user-body {
  position: absolute;
  left: 4rpx;
  top: 15rpx;
  width: 20rpx;
  height: 11rpx;
  border-radius: 11rpx 11rpx 6rpx 6rpx;
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

.icon-profile.active .user-head,
.icon-profile.active .user-body {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
}
</style>
