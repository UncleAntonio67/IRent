const store = require("../../utils/store");
const { computeRoomStatus } = require("../../utils/roomStatus");

function matchesFilter(filterStatus, s) {
  if (filterStatus === "all") return true;
  if (filterStatus === "overdue") return s === "overdue";
  if (filterStatus === "due_soon") return s === "due_soon";
  // Prototype: "已租" highlights rented + due_soon, but not overdue.
  if (filterStatus === "rented") return s === "rented" || s === "due_soon";
  if (filterStatus === "empty") return s === "empty";
  return true;
}

function miniClass(s) {
  if (s === "empty") return "mini-empty";
  if (s === "rented") return "mini-rented";
  if (s === "due_soon") return "mini-due_soon";
  if (s === "overdue") return "mini-overdue";
  return "mini-empty";
}

function dotClass(s) {
  return `r-dot-${s}`;
}

function buildVM(state, { filterStatus, activePropertyId, activeBlockId, editMode }) {
  const now = new Date();
  const properties = (state.properties || []).map((p) => ({
    ...p,
    blocks: (p.blocks || []).map((b) => ({
      ...b,
      floors: (b.floors || []).slice().sort((a, c) => Number(c.floor) - Number(a.floor)).map((f) => ({
        ...f,
        rooms: (f.rooms || []).map((r) => {
          const s = computeRoomStatus(r, now);
          const ok = matchesFilter(filterStatus, s);
          return {
            ...r,
            _status: s,
            _dim: !ok,
            _miniClass: miniClass(s),
            _miniDim: !ok,
            _cardClass: editMode ? "status-edit" : `status-${s}`,
            _dotClass: dotClass(s)
          };
        })
      }))
    }))
  }));

  // Stats across all rooms (prototype behavior)
  let overdue = 0;
  let dueSoon = 0;
  for (const p of properties) {
    for (const b of p.blocks || []) {
      for (const f of b.floors || []) {
        for (const r of f.rooms || []) {
          if (r._status === "overdue") overdue += 1;
          if (r._status === "due_soon") dueSoon += 1;
        }
      }
    }
  }

  const activeProperty =
    properties.find((p) => p.id === activePropertyId) || properties[0] || null;

  if (activeProperty) {
    for (const b of activeProperty.blocks || []) {
      let rooms = 0;
      let empty = 0;
      for (const f of b.floors || []) {
        for (const r of f.rooms || []) {
          rooms += 1;
          if (r._status === "empty") empty += 1;
        }
      }
      b._rooms = rooms;
      b._empty = empty;

      // For add-room buttons to know which block they belong to in WXML.
      for (const f of b.floors || []) f._blockId = b.id;
    }
  }

  const activeBlock =
    activeProperty && (activeProperty.blocks || []).find((b) => b.id === activeBlockId);

  const detailBlocks = activeProperty
    ? (editMode ? activeProperty.blocks : activeBlock ? [activeBlock] : [])
    : [];

  return {
    properties,
    stats: { overdue, dueSoon },
    activeProperty,
    activeBlockName: activeBlock ? activeBlock.name : "",
    detailBlocks
  };
}

Page({
  data: {
    properties: [],
    activePropertyId: "",
    activeBlockId: "",
    activeBlockName: "",
    activeProperty: null,
    detailBlocks: [],
    stats: { overdue: 0, dueSoon: 0 },

    editMode: false,
    filterStatus: "all",

    selectedRoomId: "",
    detailVisible: false,

    addVisible: false,
    addType: "",
    addTitle: "",
    addHint: "",
    addPlaceholder: "",
    addMode: "text",
    addValue: "",
    addBlockId: "",
    addFloorNo: 0
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setSelected(0);
    }
    const state = store.getAppState();
    const activePropertyId =
      this.data.activePropertyId || (state.properties && state.properties[0] ? state.properties[0].id : "");
    this.setData({ activePropertyId }, () => this.refresh());
  },

  refresh() {
    const state = store.getAppState();
    const vm = buildVM(state, {
      filterStatus: this.data.filterStatus,
      activePropertyId: this.data.activePropertyId,
      activeBlockId: this.data.activeBlockId,
      editMode: this.data.editMode
    });
    this.setData({
      properties: vm.properties,
      stats: vm.stats,
      activeProperty: vm.activeProperty,
      activeBlockName: vm.activeBlockName,
      detailBlocks: vm.detailBlocks
    });
  },

  toggleEditMode() {
    const next = !this.data.editMode;
    this.setData(
      { editMode: next, activeBlockId: next ? "" : this.data.activeBlockId, filterStatus: "all" },
      () => this.refresh()
    );
  },

  setFilter(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ filterStatus: key }, () => this.refresh());
  },

  setActiveProperty(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activePropertyId: id, activeBlockId: "" }, () => this.refresh());
  },

  enterBlock(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeBlockId: id }, () => this.refresh());
  },

  backToOverview() {
    this.setData({ activeBlockId: "" }, () => this.refresh());
  },

  onRoomTap(e) {
    const roomId = e.currentTarget.dataset.roomid;
    if (!roomId) return;

    if (this.data.editMode) {
      wx.showModal({
        title: "删除房间",
        content: "确认删除该房间？此操作不可恢复。",
        confirmText: "删除",
        confirmColor: "#f43f5e",
        success: (res) => {
          if (!res.confirm) return;
          store.deleteRoom(roomId);
          wx.showToast({ title: "操作成功", icon: "success" });
          this.refresh();
        }
      });
      return;
    }

    this.setData({ selectedRoomId: roomId, detailVisible: true });
  },

  closeDetail() {
    this.setData({ detailVisible: false });
  },

  openAddProperty() {
    this.setData({
      addVisible: true,
      addType: "property",
      addTitle: "新建院落",
      addHint: "建议使用院落/小区名称",
      addPlaceholder: "例如：星河苑",
      addMode: "text",
      addValue: ""
    });
  },

  openAddFloor(e) {
    const blockId = e.currentTarget.dataset.blockid;
    this.setData({
      addVisible: true,
      addType: "floor",
      addTitle: "加盖新楼层",
      addHint: "请输入楼层号(数字)",
      addPlaceholder: "例如：3",
      addMode: "number",
      addValue: "",
      addBlockId: blockId
    });
  },

  openAddBlock() {
    this.setData({
      addVisible: true,
      addType: "block",
      addTitle: "建造新楼栋",
      addHint: "请输入楼栋名称",
      addPlaceholder: "例如：北房主楼",
      addMode: "text",
      addValue: ""
    });
  },

  openAddRoom(e) {
    const blockId = e.currentTarget.dataset.blockid;
    const floorNo = Number(e.currentTarget.dataset.floor || 0);
    this.setData({
      addVisible: true,
      addType: "room",
      addTitle: "新建房间",
      addHint: "请输入房号(例如：301 / 北301 / A201)",
      addPlaceholder: "例如：301",
      addMode: "text",
      addValue: "",
      addBlockId: blockId,
      addFloorNo: floorNo
    });
  },

  onAddInput(e) {
    this.setData({ addValue: e.detail.value });
  },

  closeAdd() {
    this.setData({ addVisible: false });
  },

  confirmAdd() {
    const type = this.data.addType;
    const state = store.getAppState();
    const propertyId =
      this.data.activePropertyId || (state.properties && state.properties[0] ? state.properties[0].id : "");

    if (type === "property") {
      store.addProperty({ name: this.data.addValue });
      wx.showToast({ title: "操作成功", icon: "success" });
      this.setData({ addVisible: false }, () => this.refresh());
      return;
    }

    if (type === "block") {
      store.addBlock({ propertyId, name: this.data.addValue });
      wx.showToast({ title: "操作成功", icon: "success" });
      this.setData({ addVisible: false }, () => this.refresh());
      return;
    }

    if (type === "floor") {
      store.addFloor({
        propertyId,
        blockId: this.data.addBlockId,
        floorNo: Number(this.data.addValue || 0)
      });
      wx.showToast({ title: "操作成功", icon: "success" });
      this.setData({ addVisible: false }, () => this.refresh());
      return;
    }

    if (type === "room") {
      store.addRoom({
        propertyId,
        blockId: this.data.addBlockId,
        floorNo: Number(this.data.addFloorNo || 0),
        roomNo: this.data.addValue
      });
      wx.showToast({ title: "操作成功", icon: "success" });
      this.setData({ addVisible: false }, () => this.refresh());
      return;
    }
  }
});
