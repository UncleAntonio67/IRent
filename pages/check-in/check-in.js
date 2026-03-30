const store = require("../../utils/store");
const { generateSchedule } = require("../../utils/schedule");

function ymdToDots(ymd) {
  // "YYYY-MM-DD" -> "YYYY.MM.DD"
  if (!ymd) return "";
  return ymd.replace(/-/g, ".");
}

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function addDaysYMD(ymd, days) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

Page({
  data: {
    roomId: "",
    startDate: "",
    endDate: "",
    monthlyRent: 3000,
    deposit: 3000,
    paymentCycle: 3,

    tenant: "",
    phone: "",
    idCard: "",
    hasContract: false,
    contractCount: 0,

    utilsInc: false,
    waterPrice: 4,
    electricPrice: 1.2,
    initWater: 0,
    initElectric: 0,

    schedule: [],
    scheduleCount: 0,
    firstExpected: 0,
    firstPaidRent: 0,
    firstTotal: 0,

    submitDisabled: true,
    submitText: "请完善信息"
  },

  onLoad(options) {
    const roomId = options.roomId || "";
    const startDate = todayYMD();
    const endDate = addDaysYMD(startDate, 365 - 1);

    // Pull a few defaults from room.
    const state = store.getAppState();
    const hit = store.findRoomById(state, roomId);
    const room = hit ? hit.room : null;

    this.setData(
      {
        roomId,
        startDate,
        endDate,
        monthlyRent: room ? room.rent : 3000,
        deposit: room ? room.deposit : 3000,
        paymentCycle: room ? room.paymentCycle : 3,
        waterPrice: room ? room.waterPrice : 4,
        electricPrice: room ? room.electricPrice : 1.2
      },
      () => this.recalc()
    );
  },

  recalc() {
    const schedule = generateSchedule({
      startDate: ymdToDots(this.data.startDate),
      endDate: ymdToDots(this.data.endDate),
      cycleMonths: this.data.paymentCycle,
      monthlyRent: Number(this.data.monthlyRent || 0)
    });

    const firstExpected = schedule[0] ? Number(schedule[0].expectedAmount || 0) : 0;
    const firstPaidRent =
      this.data.firstPaidRent && Number(this.data.firstPaidRent) > 0
        ? Number(this.data.firstPaidRent)
        : firstExpected;
    const firstTotal = firstPaidRent + Number(this.data.deposit || 0);

    const missing = [];
    if (!this.data.tenant) missing.push("姓名");
    if (!this.data.hasContract) missing.push("合同");
    const submitDisabled = missing.length > 0;
    const submitText = submitDisabled ? `请补齐：${missing.join("、")}` : "确认办理";

    this.setData({
      schedule,
      scheduleCount: schedule.length,
      firstExpected,
      firstPaidRent,
      firstTotal,
      submitDisabled,
      submitText
    });
  },

  onPickStart(e) {
    this.setData({ startDate: e.detail.value }, () => this.recalc());
  },
  onPickEnd(e) {
    this.setData({ endDate: e.detail.value }, () => this.recalc());
  },
  onRent(e) {
    this.setData({ monthlyRent: Number(e.detail.value || 0) }, () => this.recalc());
  },
  onDeposit(e) {
    this.setData({ deposit: Number(e.detail.value || 0) }, () => this.recalc());
  },
  setCycle(e) {
    this.setData({ paymentCycle: Number(e.currentTarget.dataset.cycle || 3) }, () => this.recalc());
  },

  onTenant(e) {
    this.setData({ tenant: e.detail.value || "" }, () => this.recalc());
  },
  onPhone(e) {
    this.setData({ phone: e.detail.value || "" });
  },
  onIdCard(e) {
    this.setData({ idCard: e.detail.value || "" });
  },

  pickContract() {
    wx.chooseMedia({
      count: 3,
      mediaType: ["image"],
      sourceType: ["camera", "album"],
      success: (res) => {
        const files = (res.tempFiles || []).length;
        this.setData({ hasContract: files > 0, contractCount: files }, () => this.recalc());
      }
    });
  },

  onUtilsInc(e) {
    this.setData({ utilsInc: !!e.detail.value });
  },
  onWaterPrice(e) {
    this.setData({ waterPrice: Number(e.detail.value || 0) });
  },
  onElectricPrice(e) {
    this.setData({ electricPrice: Number(e.detail.value || 0) });
  },
  onInitWater(e) {
    this.setData({ initWater: Number(e.detail.value || 0) });
  },
  onInitElectric(e) {
    this.setData({ initElectric: Number(e.detail.value || 0) });
  },

  onFirstPaidRent(e) {
    this.setData({ firstPaidRent: Number(e.detail.value || 0) }, () => this.recalc());
  },

  submit() {
    if (this.data.submitDisabled) return;
    if (!this.data.schedule || this.data.schedule.length === 0) {
      wx.showToast({ title: "租期不合法", icon: "error" });
      return;
    }
    const leaseStart = ymdToDots(this.data.startDate);
    const leaseEnd = ymdToDots(this.data.endDate);
    store.checkIn(this.data.roomId, {
      tenant: this.data.tenant,
      phone: this.data.phone,
      idCard: this.data.idCard,
      leaseStart,
      leaseEnd,
      rent: Number(this.data.monthlyRent || 0),
      deposit: Number(this.data.deposit || 0),
      paymentCycle: Number(this.data.paymentCycle || 3),
      hasContract: this.data.hasContract,
      utilsInc: this.data.utilsInc,
      waterPrice: this.data.waterPrice,
      electricPrice: this.data.electricPrice,
      initWater: this.data.initWater,
      initElectric: this.data.initElectric,
      schedule: this.data.schedule,
      firstPaidRent: Number(this.data.firstPaidRent || 0)
    });

    wx.showToast({ title: "操作成功", icon: "success" });
    setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
  }
});
