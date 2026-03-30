Component({
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: "新建" },
    hint: { type: String, value: "" },
    placeholder: { type: String, value: "" },
    confirmText: { type: String, value: "确认" },
    mode: { type: String, value: "text" }, // text | number
    value: { type: String, value: "" }
  },

  methods: {
    onInput(e) {
      this.triggerEvent("input", { value: e.detail.value || "" });
    },
    onCancel() {
      this.triggerEvent("cancel");
    },
    onConfirm() {
      this.triggerEvent("confirm");
    }
  }
});

