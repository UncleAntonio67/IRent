<script>
import { initializePublicAccount } from './data/authStore.js'
import { initializeSyncStatus } from './data/syncStatus.js'
import { startSyncQueue } from './data/syncQueue.js'

export default {
  onLaunch() {
    console.log('App Launch')
    void initializePublicAccount().finally(() => startSyncQueue())
    initializeSyncStatus()
    startSyncQueue()
    try {
      uni.onNetworkStatusChange((result) => {
        if (result?.isConnected) void initializePublicAccount().finally(() => startSyncQueue())
      })
    } catch {}
  },
  onShow() {
    console.log('App Show')
    // Timers can be suspended while the mini-program is in the background.
    // Resume the durable FIFO queue immediately when the user returns online.
    void initializePublicAccount().finally(() => startSyncQueue())
  },
  onHide() {
    console.log('App Hide')
  },
}
</script>

<style>
@import "./tailwind.generated.css";
@import "./styles/utilities.css";

page {
  background-color: #f8fafc;
  color: #0f172a;
}

button {
  margin: 0;
  padding-left: 0;
  padding-right: 0;
  line-height: 1.2;
  background: transparent;
  border: 0;
  border-style: none;
  outline: none;
  box-sizing: border-box;
  color: inherit;
}

input,
textarea {
  box-sizing: border-box;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

input { border-radius: 12px; }
textarea { border-radius: 16px; }
</style>
