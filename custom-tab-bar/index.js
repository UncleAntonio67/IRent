Component({
  data: {
    selected: 0,
    hidden: false
  },

  methods: {
    setSelected(index) {
      this.setData({ selected: index });
    },

    setHidden(hidden) {
      this.setData({ hidden: !!hidden });
    },

    hide() {
      this.setHidden(true);
    },

    show() {
      this.setHidden(false);
    },

    onTap(e) {
      const path = e.currentTarget.dataset.path;
      const index = Number(e.currentTarget.dataset.index || 0);
      this.setSelected(index);
      wx.switchTab({ url: path });
    }
  }
});
