const store = require("../../utils/store");
const { computeTermStatus } = require("../../utils/roomStatus");

Page({
  data: {
    roomId: "",
    roomNo: "",
    tenant: "",
    utilsAmount: 0,
    pendingTerms: 0,
    note: ""
  },

  onLoad(options) {
    const roomId = options.roomId || "";
    this.setData({ roomId }, () => this.refresh());
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  refresh() {
    const state = store.getAppState();
    const hit = store.findRoomById(state, this.data.roomId);
    const room = hit ? hit.room : null;
    if (!room) return;

    const pendingTerms = (room.paymentSchedule || []).filter(
      (t) => computeTermStatus(t, new Date()) !== "paid"
    ).length;

    this.setData({
      roomNo: room.roomNo,
      tenant: room.tenant || "",
      utilsAmount: Number(room.utilsAmount || 0),
      pendingTerms
    });
  },

  onNote(e) {
    this.setData({ note: e.detail.value || "" });
  },

  submit() {
    wx.showModal({
      title: "确认退租",
      content: "退租将清空该房间的租客信息、账单与交租计划。确认继续？",
      confirmText: "确认退租",
      confirmColor: "#f43f5e",
      success: (res) => {
        if (!res.confirm) return;
        store.checkOut(this.data.roomId, { note: this.data.note });
        wx.showToast({ title: "操作成功", icon: "success" });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      }
    });
  }
});
