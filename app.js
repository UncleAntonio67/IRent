const storage = require("./utils/storage");
const mock = require("./utils/mock");

App({
  globalData: {
    // Single source of truth; pages derive view models on demand.
    state: null
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

