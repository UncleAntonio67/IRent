const store = require("../../utils/store");
const { computeRoomStatus } = require("../../utils/roomStatus");

Page({
  data: {
    landlord: { name: "", phone: "" },
    landlordName: "",
    avatarText: "李",
    stats: {
      totalRooms: 0,
      rented: 0,
      empty: 0,
      overdue: 0,
      pendingAmount: 0,
      yearTotal: 0,
      propertyCount: 0
    }
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setSelected(2);
    }
    const state = store.getAppState();
    const now = new Date();

    let totalRooms = 0;
    let rented = 0;
    let empty = 0;
    let overdue = 0;
    store.walkRooms(state, (room) => {
      if (!room) return;
      totalRooms += 1;
      const s = computeRoomStatus(room, now);
      if (s === "empty") empty += 1;
      else rented += 1;
      if (s === "overdue") overdue += 1;
    });

    const pending = store.derivePendingItems(now);
    const pendingAmount = pending.reduce((acc, x) => acc + Number(x.amount || 0), 0);
    const yearTotal = store.calcYearTotals(new Date().getFullYear());
    const propertyCount = (state.properties || []).length;
    const landlordName = (state.landlord && state.landlord.name) || "李房东";
    const avatarText = landlordName ? landlordName.slice(0, 1) : "李";

    this.setData({
      landlord: state.landlord || { name: "", phone: "" },
      landlordName,
      avatarText,
      stats: { totalRooms, rented, empty, overdue, pendingAmount, yearTotal, propertyCount }
    });
  },
  onFeature(e) {
    const title = e.currentTarget.dataset.title || "该功能";
    wx.showToast({ title: "即将上线", icon: "none" });
    // Keep success toasts for successful operations only; feature entry is informational.
    console.log("feature_click:", title);
  },
  logout() {
    wx.showToast({ title: "已安全退出", icon: "none" });
  }
});
