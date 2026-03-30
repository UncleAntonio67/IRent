const store = require("../../utils/store");

function calc(room, currentWater, currentElectric) {
  const w0 = Number(room.lastWater || 0);
  const e0 = Number(room.lastElectric || 0);
  const w1 = Number(currentWater || 0);
  const e1 = Number(currentElectric || 0);

  const waterDelta = Math.max(0, w1 - w0);
  const electricDelta = Math.max(0, e1 - e0);
  const waterAmount = Math.round(waterDelta * Number(room.waterPrice || 0));
  const electricAmount = Math.round(electricDelta * Number(room.electricPrice || 0));
  return { waterDelta, electricDelta, waterAmount, electricAmount, total: waterAmount + electricAmount };
}

Page({
  data: {
    roomId: "",
    roomNo: "",
    tenant: "",
    lastWater: 0,
    lastElectric: 0,
    waterPrice: 0,
    electricPrice: 0,

    currentWater: 0,
    currentElectric: 0,
    photoCount: 0,

    waterDelta: 0,
    electricDelta: 0,
    waterAmount: 0,
    electricAmount: 0,
    total: 0,
    templateText: ""
  },

  onLoad(options) {
    const roomId = options.roomId || "";
    const state = store.getAppState();
    const hit = store.findRoomById(state, roomId);
    const room = hit ? hit.room : null;
    if (!room) return;

    this.setData(
      {
        roomId,
        roomNo: room.roomNo,
        tenant: room.tenant || "",
        lastWater: room.lastWater || 0,
        lastElectric: room.lastElectric || 0,
        waterPrice: room.waterPrice || 0,
        electricPrice: room.electricPrice || 0,
        currentWater: room.lastWater || 0,
        currentElectric: room.lastElectric || 0
      },
      () => this.recalc()
    );
  },

  recalc() {
    const state = store.getAppState();
    const hit = store.findRoomById(state, this.data.roomId);
    const room = hit ? hit.room : null;
    if (!room) return;

    const r = calc(room, this.data.currentWater, this.data.currentElectric);
    const monthStr = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`;
    const tpl = `${this.data.tenant || "租客"}您好，${this.data.roomNo}房${monthStr}水电杂费已出：\n` +
      `水费(${Number(r.waterDelta).toFixed(1)}度) 合计 ¥${Number(r.waterAmount).toFixed(2)}\n` +
      `电费(${Number(r.electricDelta).toFixed(1)}度) 合计 ¥${Number(r.electricAmount).toFixed(2)}\n` +
      `-------------------\n` +
      `总计：¥${Number(r.total).toFixed(2)}\n` +
      `请及时支付，谢谢。`;

    this.setData({ ...r, templateText: tpl });
  },

  onWater(e) {
    this.setData({ currentWater: Number(e.detail.value || 0) }, () => this.recalc());
  },
  onElectric(e) {
    this.setData({ currentElectric: Number(e.detail.value || 0) }, () => this.recalc());
  },

  pickPhoto() {
    wx.chooseMedia({
      count: 3,
      mediaType: ["image"],
      sourceType: ["camera", "album"],
      success: (res) => {
        this.setData({ photoCount: (res.tempFiles || []).length });
      }
    });
  },

  submit() {
    store.createUtilitiesBill(this.data.roomId, {
      currentWater: this.data.currentWater,
      currentElectric: this.data.currentElectric,
      photoCount: this.data.photoCount
    });
    wx.showToast({ title: "操作成功", icon: "success" });
    setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
  },

  copyTemplate() {
    const text = this.data.templateText || "";
    if (!text) return;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: "已复制", icon: "success" })
    });
  }
});
