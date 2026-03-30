const store = require("../../utils/store");

Page({
  data: {
    billFilter: "pending",
    billStats: { currentYearTotal: 0, currentYearPending: 0, rentTotal: 0, utilsTotal: 0 },
    pendingItems: [],
    paidFlows: [],

    verifyVisible: false,
    verifyTitle: "核销收款",
    verifyAmount: 0,
    verifyKind: "",
    verifyRoomId: "",
    verifyTermId: "",
    verifyBillId: ""
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setSelected(1);
    }
    this.refresh();
  },

  refresh() {
    const year = new Date().getFullYear();
    const now = new Date();

    const pendingItemsRaw = store.derivePendingItems(now);
    const paidFlowsRaw = store.derivePaidBills();

    // Mirror prototype: split totals into rent-ish vs utilities-ish.
    let rentTotal = 0;
    let utilsTotal = 0;
    for (const b of paidFlowsRaw) {
      rentTotal += Number(b.rent || 0) + Number(b.deposit || 0);
      utilsTotal += Number(b.water || 0) + Number(b.electric || 0);
    }

    const currentYearTotal = store.calcYearTotals(year);
    const currentYearPending = pendingItemsRaw.reduce((acc, x) => acc + Number(x.amount || 0), 0);

    const pendingItems = pendingItemsRaw.map((x) => ({
      ...x,
      tenant: "", // filled below
      date: x.kind === "bill" ? "挂账待核销" : `交款日: ${x.dueDate}`,
      _tagText: x.status === "overdue" ? "已逾期" : "即将到期",
      _tagClass: x.status === "overdue" ? "tag-danger" : "tag-warn",
      _leftClass: x.status === "overdue" ? "overdue" : "due"
    }));

    // Attach tenant for pending items (prototype displays tenant next to roomNo).
    const state = store.getAppState();
    const roomTenant = {};
    store.walkRooms(state, (r) => {
      roomTenant[r.id] = r.tenant || "";
    });
    for (const item of pendingItems) item.tenant = roomTenant[item.roomId] || "";

    const paidFlows = paidFlowsRaw.map((b) => ({
      ...b,
      tenant: roomTenant[b.roomId] || ""
    }));

    this.setData({
      pendingItems,
      paidFlows,
      billStats: { currentYearTotal, currentYearPending, rentTotal, utilsTotal }
    });
  },

  setBillFilter(e) {
    this.setData({ billFilter: e.currentTarget.dataset.tab });
  },

  openVerify(e) {
    const ds = e.currentTarget.dataset;
    this.setData({
      verifyVisible: true,
      verifyTitle: `核销 ${ds.title}`,
      verifyAmount: Number(ds.amount || 0),
      verifyKind: ds.kind,
      verifyRoomId: ds.roomid,
      verifyTermId: ds.termid || "",
      verifyBillId: ds.billid || ""
    });
  },

  closeVerify() {
    this.setData({ verifyVisible: false });
  },

  confirmVerify() {
    const kind = this.data.verifyKind;
    if (kind === "term") {
      store.verifyPaymentTerm(this.data.verifyRoomId, this.data.verifyTermId, this.data.verifyAmount);
    } else if (kind === "bill") {
      store.verifyBill(this.data.verifyRoomId, this.data.verifyBillId);
    }

    this.setData({ verifyVisible: false });
    wx.showToast({ title: "操作成功", icon: "success" });
    this.refresh();
  }
});
