import { computed, ref } from 'vue'

// One application-level status source prevents every page from independently
// showing a transient "syncing" banner whenever it becomes visible.
const networkType = ref('unknown')
const statusRevision = ref(0)
let initialized = false

function applyNetworkType(value) {
  networkType.value = String(value || 'unknown').toLowerCase()
}

export function initializeSyncStatus() {
  if (initialized) return
  initialized = true
  try {
    uni.getNetworkType({
      success: (result) => applyNetworkType(result?.networkType),
      fail: () => applyNetworkType('unknown'),
    })
    uni.onNetworkStatusChange((result) => {
      applyNetworkType(result?.isConnected ? result?.networkType : 'none')
      notifySyncStatusChanged()
    })
  } catch {
    applyNetworkType('unknown')
  }
}

export function notifySyncStatusChanged() {
  statusRevision.value += 1
}

export function useSyncStatus() {
  return {
    revision: statusRevision,
    isOffline: computed(() => networkType.value === 'none'),
    networkType,
  }
}
