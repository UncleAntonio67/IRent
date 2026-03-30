Component({
  data: {
    selected: 0
  },

  methods: {
    setSelected(index) {
      this.setData({ selected: index });
    },

    onTap(e) {
      const path = e.currentTarget.dataset.path;
      const index = Number(e.currentTarget.dataset.index || 0);
      this.setSelected(index);
      wx.switchTab({ url: path });
    }
  }
});

