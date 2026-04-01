const storage = require("./utils/storage");
const mock = require("./utils/mock");

// Used to confirm the running code matches the latest git push.
// Keep subtle in UI (e.g. Profile footer) and remove once rollout is stable.
const BUILD_INFO = {
  id: "ui-20260401-1545",
  at: "2026-04-01 15:45"
};

App({
  globalData: {
    // Single source of truth; pages derive view models on demand.
    state: null,
    build: BUILD_INFO
  },

  onLaunch() {
    const persisted = storage.safeGet("rent_manager_state_v1");
    if (persisted && typeof persisted === "object" && persisted.properties) {
      this.globalData.state = persisted;
      return;
    }

    this.globalData.state = mock.createInitialState();
    storage.safeSet("rent_manager_state_v1", this.globalData.state);
  },

  persist() {
    storage.safeSet("rent_manager_state_v1", this.globalData.state);
  }
});
