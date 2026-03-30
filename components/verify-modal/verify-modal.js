const { formatYMDHM } = require("../../utils/date");

Component({
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: "核销收款" },
    amount: { type: Number, value: 0 },
    confirmText: { type: String, value: "确认核销" }
  },

  data: {
    nowText: ""
  },

  observers: {
    visible(v) {
      if (v) this.setData({ nowText: formatYMDHM(new Date()) });
    }
  },

  methods: {
    noop() {},
    onCancel() {
      this.triggerEvent("cancel");
    },
    onConfirm() {
      const amount = Number(this.data.amount || 0);
      const title = this.data.title || "核销收款";
      const time = this.data.nowText || formatYMDHM(new Date());

      // UX guideline: dangerous ops require wx.showModal second confirm.
      wx.showModal({
        title,
        content: `应收 ¥${amount}\n时间 ${time}\n确认核销？`,
        confirmText: "确认",
        success: (res) => {
          if (!res.confirm) return;
          this.triggerEvent("confirm");
        }
      });
    }
  }
});
