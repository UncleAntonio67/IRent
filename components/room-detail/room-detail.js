const store = require("../../utils/store");
const { computeRoomStatus, computeTermStatus } = require("../../utils/roomStatus");
const { generateSchedule } = require("../../utils/schedule");

function ymdDash(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const da = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function addDaysDash(ymd, days) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  const x = new Date(y, m - 1, d);
  x.setDate(x.getDate() + days);
  return ymdDash(x);
}

function dashToDot(ymd) {
  if (!ymd) return "";
  return String(ymd).replace(/-/g, ".");
}

function round2(n) {
  const x = Number(n || 0);
  return Math.round(x * 100) / 100;
}

function cycleText(c) {
  if (Number(c) === 3) return "季付";
  if (Number(c) === 6) return "半年付";
  if (Number(c) === 12) return "年付";
  return `${c}个月`;
}

function roomTag(status) {
  if (status === "empty") return { text: "空置中", cls: "", status };
  if (status === "overdue") return { text: "逾期未缴", cls: "tag-danger", status };
  if (status === "due_soon") return { text: "待收款", cls: "tag-warn", status };
  return { text: "正常履约", cls: "tag-success", status: "rented" };
}

function termBoxClass(s) {
  if (s === "paid") return "boxPaid";
  if (s === "overdue") return "boxOverdue";
  return "boxDue";
}

function termTag(s) {
  if (s === "paid") return { text: "已结清", cls: "tag-success" };
  if (s === "overdue") return { text: "已逾期", cls: "tag-danger" };
  if (s === "due_soon") return { text: "待收款", cls: "tag-warn" };
  return { text: "未付款", cls: "" };
}

Component({
  properties: {
    visible: { type: Boolean, value: false },
    roomId: { type: String, value: "" }
  },

  data: {
    room: {
      roomNo: "",
      status: "empty",
      tenant: null,
      phone: "",
      idCard: "",
      lease: "",
      hasContract: false,
      rent: 0,
      deposit: 0,
      paymentCycle: 3,
      utilsInc: false,
      lastWater: 0,
      lastElectric: 0,
      waterPrice: 0,
      electricPrice: 0,
      utilsAmount: 0,
      paymentSchedule: [],
      bills: [],
      history: []
    },

    roomTab: "current",
    roomTagText: "",
    roomTagClass: "",
    roomTagStatus: "empty",
    avatar: "客",
    cycleText: "",
    termsVM: [],
    paidSum: 0,
    progressPct: 0,
    paidBills: [],
    historyVM: [],

    // Verify modal
    verifyVisible: false,
    verifyTitle: "",
    verifyAmount: 0,
    verifyKind: "",
    verifyTermId: "",
    verifyBillId: "",

    // Contract modal
    showContractModal: false,

    // Bill modal
    showBillModal: false,
    currentWater: "",
    currentElectric: "",
    waterPhotoCount: 0,
    electricPhotoCount: 0,
    billCalcReady: false,
    billTemplate: "",
    billTotal: 0,
    billReadWater: 0,
    billReadElectric: 0,

    // Check-in modal
    showCheckInModal: false,
    checkInForm: {
      tenantName: "",
      tenantPhone: "",
      idCard: "",
      leaseStart: "",
      leaseEnd: "",
      rentAmount: "",
      depositAmount: "",
      paymentCycle: 3,
      utilsInc: false,
      initWater: "",
      initElectric: "",
      contractUploaded: false,
      customInitialPayment: ""
    },
    previewSchedule: [],
    initialPayment: { firstRent: 0, deposit: 0, calculatedTotal: 0, actualTotal: 0 },
    checkInSubmitDisabled: true,
    checkInSubmitText: "请完善信息",

    // Check-out modal
    showCheckOutModal: false,
    checkOutForm: { endWater: "", endElectric: "", refundAmount: "", remark: "正常到期退租" },
    outEstWater: 0,
    outEstElectric: 0
  },

  observers: {
    visible(v) {
      if (v) this.refresh();
    },
    roomId() {
      if (this.data.visible) this.refresh();
    }
  },

  methods: {
    noop() {},

    refresh() {
      const state = store.getAppState();
      const hit = store.findRoomById(state, this.data.roomId);
      if (!hit) return;
      const room = hit.room;

      const rs = computeRoomStatus(room, new Date());
      const tag = roomTag(rs);
      const avatar = room.tenant ? String(room.tenant).slice(0, 1) : "客";

      const schedule = room.paymentSchedule || [];
      let paidSum = 0;
      let expectedSum = 0;
      const termsVM = schedule.map((t) => {
        const s = computeTermStatus(t, new Date());
        const tg = termTag(s);
        const expectedAmount = Number(t.expectedAmount || 0);
        const paidAmount = Number(t.paidAmount || 0);
        paidSum += paidAmount;
        expectedSum += expectedAmount;
        return {
          ...t,
          expectedAmount: round2(expectedAmount),
          paidAmount: round2(paidAmount),
          _boxClass: termBoxClass(s),
          _tagText: tg.text,
          _tagClass: tg.cls,
          _verifyAmount: round2(Math.max(0, expectedAmount - paidAmount))
        };
      });

      const progressPct = expectedSum > 0 ? Math.round((paidSum / expectedSum) * 100) : 0;
      const paidBills = (room.bills || []).filter((b) => b && b.status === "paid");
      const historyVM = (room.history || []).map((h, idx) => ({
        ...h,
        _dotClass: idx === 0 ? "on" : ""
      }));

      this.setData({
        room,
        roomTagText: tag.text,
        roomTagClass: tag.cls,
        roomTagStatus: tag.status,
        avatar,
        cycleText: cycleText(room.paymentCycle),
        termsVM,
        paidSum: round2(paidSum),
        progressPct,
        paidBills,
        historyVM,
        // Default tab: current for rented, current for empty too.
        roomTab: room.tenant ? this.data.roomTab : "current"
      });
    },

    emitClose() {
      this.triggerEvent("close");
    },

    setRoomTab(e) {
      const tab = e.currentTarget.dataset.tab;
      this.setData({ roomTab: tab });
    },

    callTenant() {
      const phone = (this.data.room && this.data.room.phone) || "";
      if (!phone) return;
      wx.makePhoneCall({ phoneNumber: phone });
    },

    /* Verify flow */
    openVerifyTerm(e) {
      const termId = e.currentTarget.dataset.termid;
      const amount = Number(e.currentTarget.dataset.amount || 0);
      const term = (this.data.termsVM || []).find((t) => t.id === termId);
      if (!term) return;
      this.setData({
        verifyVisible: true,
        verifyTitle: `第${term.term}期租金`,
        verifyAmount: round2(amount),
        verifyKind: "term",
        verifyTermId: termId,
        verifyBillId: ""
      });
    },

    closeVerify() {
      this.setData({ verifyVisible: false });
    },

    confirmVerify() {
      if (this.data.verifyKind === "term") {
        store.verifyPaymentTerm(this.data.roomId, this.data.verifyTermId, this.data.verifyAmount);
      } else if (this.data.verifyKind === "bill") {
        store.verifyBill(this.data.roomId, this.data.verifyBillId);
      }
      this.setData({ verifyVisible: false });
      wx.showToast({ title: "操作成功", icon: "success" });
      this.refresh();
      this.triggerEvent("changed");
    },

    /* Contract */
    openContract() {
      this.setData({ showContractModal: true });
    },
    closeContract() {
      this.setData({ showContractModal: false });
    },
    uploadContract() {
      const uploaded = !!this.data.room.hasContract;
      if (uploaded) {
        // Toggle off for demo
        store.updateRoom(this.data.roomId, (r) => {
          r.hasContract = false;
          return r;
        });
        wx.showToast({ title: "操作成功", icon: "success" });
        this.refresh();
        return;
      }

      wx.chooseMedia({
        count: 3,
        mediaType: ["image"],
        sourceType: ["camera", "album"],
        success: (res) => {
          const count = (res.tempFiles || []).length;
          if (count <= 0) return;
          store.updateRoom(this.data.roomId, (r) => {
            r.hasContract = true;
            return r;
          });
          wx.showToast({ title: "操作成功", icon: "success" });
          this.refresh();
        }
      });
    },

    toggleCheckInContract() {
      const uploaded = !!this.data.checkInForm.contractUploaded;
      if (uploaded) {
        this.setData({ "checkInForm.contractUploaded": false }, () => this.recalcCheckIn());
        return;
      }

      wx.chooseMedia({
        count: 3,
        mediaType: ["image"],
        sourceType: ["camera", "album"],
        success: (res) => {
          const count = (res.tempFiles || []).length;
          if (count <= 0) return;
          this.setData({ "checkInForm.contractUploaded": true }, () => this.recalcCheckIn());
          wx.showToast({ title: "操作成功", icon: "success" });
        }
      });
    },

    /* Bill modal */
    openBillModal() {
      const room = this.data.room;
      const cw = String(Number(room.lastWater || 0) + 5);
      const ce = String(Number(room.lastElectric || 0) + 50);
      this.setData(
        {
          showBillModal: true,
          currentWater: cw,
          currentElectric: ce,
          waterPhotoCount: 0,
          electricPhotoCount: 0
        },
        () => this.recalcBill()
      );
    },
    closeBillModal() {
      this.setData({ showBillModal: false });
    },
    onWaterInput(e) {
      this.setData({ currentWater: e.detail.value || "" }, () => this.recalcBill());
    },
    onElectricInput(e) {
      this.setData({ currentElectric: e.detail.value || "" }, () => this.recalcBill());
    },
    pickWaterPhoto() {
      wx.chooseMedia({
        count: 3,
        mediaType: ["image"],
        sourceType: ["camera", "album"],
        success: (res) => {
          this.setData({ waterPhotoCount: (res.tempFiles || []).length });
          wx.showToast({ title: "操作成功", icon: "success" });
        }
      });
    },
    pickElectricPhoto() {
      wx.chooseMedia({
        count: 3,
        mediaType: ["image"],
        sourceType: ["camera", "album"],
        success: (res) => {
          this.setData({ electricPhotoCount: (res.tempFiles || []).length });
          wx.showToast({ title: "操作成功", icon: "success" });
        }
      });
    },
    recalcBill() {
      const room = this.data.room;
      if (!room || room.utilsInc) {
        this.setData({ billCalcReady: false, billTemplate: "", billTotal: 0 });
        return;
      }
      const w1 = Number(this.data.currentWater);
      const e1 = Number(this.data.currentElectric);
      if (!Number.isFinite(w1) || !Number.isFinite(e1)) {
        this.setData({ billCalcReady: false, billTemplate: "", billTotal: 0 });
        return;
      }

      const waterDiff = Math.max(0, w1 - Number(room.lastWater || 0));
      const elecDiff = Math.max(0, e1 - Number(room.lastElectric || 0));
      const waterCost = round2(waterDiff * Number(room.waterPrice || 0));
      const elecCost = round2(elecDiff * Number(room.electricPrice || 0));
      const total = round2(waterCost + elecCost);

      const date = new Date();
      const monthStr = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      const tenant = room.tenant || "租客";
      const template =
        `${tenant}您好，${room.roomNo}房间${monthStr}账单已出：\n` +
        `水费(${waterDiff.toFixed(1)}度)：¥${waterCost.toFixed(2)}\n` +
        `电费(${elecDiff.toFixed(1)}度)：¥${elecCost.toFixed(2)}\n` +
        `-------------------\n` +
        `总计：¥${total.toFixed(2)}\n` +
        `请及时支付，谢谢！`;

      this.setData({
        billCalcReady: true,
        billTemplate: template,
        billTotal: total,
        billReadWater: w1,
        billReadElectric: e1
      });
    },
    copyBillTemplate() {
      if (!this.data.billTemplate) return;
      wx.setClipboardData({
        data: this.data.billTemplate,
        success: () => wx.showToast({ title: "操作成功", icon: "success" })
      });
    },
    saveBill() {
      if (!this.data.billCalcReady) return;
      if (this.data.room.utilsInc) return;

      store.createUtilitiesBill(this.data.roomId, {
        currentWater: this.data.billReadWater,
        currentElectric: this.data.billReadElectric,
        photoCount: Number(this.data.waterPhotoCount || 0) + Number(this.data.electricPhotoCount || 0)
      });

      wx.showToast({ title: "操作成功", icon: "success" });
      this.setData({ showBillModal: false });
      this.refresh();
      this.triggerEvent("changed");
    },

    /* Check-in modal */
    openCheckIn() {
      const room = this.data.room;
      const today = ymdDash(new Date());
      const end = addDaysDash(today, 365 - 1);
      const rentAmount = room.rent ? String(room.rent) : "3000";
      const depositAmount = String(room.deposit || room.rent || 0);
      this.setData(
        {
          showCheckInModal: true,
          checkInForm: {
            tenantName: "",
            tenantPhone: "",
            idCard: "",
            leaseStart: today,
            leaseEnd: end,
            rentAmount,
            depositAmount,
            paymentCycle: Number(room.paymentCycle || 3),
            utilsInc: !!room.utilsInc,
            initWater: String(room.lastWater || 0),
            initElectric: String(room.lastElectric || 0),
            contractUploaded: false,
            customInitialPayment: ""
          }
        },
        () => this.recalcCheckIn()
      );
    },
    closeCheckIn() {
      this.setData({ showCheckInModal: false });
    },
    onPickLeaseStart(e) {
      this.setData({ "checkInForm.leaseStart": e.detail.value }, () => this.recalcCheckIn());
    },
    onPickLeaseEnd(e) {
      this.setData({ "checkInForm.leaseEnd": e.detail.value }, () => this.recalcCheckIn());
    },
    onCheckInRent(e) {
      this.setData({ "checkInForm.rentAmount": e.detail.value || "" }, () => this.recalcCheckIn());
    },
    onCheckInDeposit(e) {
      this.setData({ "checkInForm.depositAmount": e.detail.value || "" }, () => this.recalcCheckIn());
    },
    setCheckInCycle(e) {
      this.setData({ "checkInForm.paymentCycle": Number(e.currentTarget.dataset.cycle || 3) }, () =>
        this.recalcCheckIn()
      );
    },
    onCheckInTenant(e) {
      this.setData({ "checkInForm.tenantName": e.detail.value || "" }, () => this.recalcCheckIn());
    },
    onCheckInPhone(e) {
      this.setData({ "checkInForm.tenantPhone": e.detail.value || "" });
    },
    onCheckInIdCard(e) {
      this.setData({ "checkInForm.idCard": e.detail.value || "" });
    },
    toggleUtilsInc(e) {
      this.setData({ "checkInForm.utilsInc": !!e.detail.value });
    },
    onCheckInInitWater(e) {
      this.setData({ "checkInForm.initWater": e.detail.value || "" });
    },
    onCheckInInitElectric(e) {
      this.setData({ "checkInForm.initElectric": e.detail.value || "" });
    },
    onCheckInCustomPay(e) {
      this.setData({ "checkInForm.customInitialPayment": e.detail.value || "" }, () => this.recalcCheckIn());
    },
    recalcCheckIn() {
      const f = this.data.checkInForm;
      const rent = Number(f.rentAmount || 0);
      const schedule = generateSchedule({
        startDate: dashToDot(f.leaseStart),
        endDate: dashToDot(f.leaseEnd),
        cycleMonths: Number(f.paymentCycle || 3),
        monthlyRent: rent
      });

      const firstRent = schedule[0] ? Number(schedule[0].expectedAmount || 0) : 0;
      const deposit = Number(f.depositAmount || 0);
      const calculatedTotal = round2(firstRent + deposit);
      const actualTotal =
        f.customInitialPayment !== "" && Number.isFinite(Number(f.customInitialPayment))
          ? round2(Number(f.customInitialPayment))
          : calculatedTotal;

      const missing = [];
      if (!f.tenantName) missing.push("租客姓名");
      if (!schedule.length) missing.push("租期/租金");
      if (!f.contractUploaded) missing.push("租赁合同");
      const disabled = missing.length > 0;
      const submitText = !disabled
        ? `确认收款 ¥${actualTotal.toFixed(2)} 并办理入住`
        : missing[0] === "租客姓名"
          ? "请填写租客姓名"
          : missing[0] === "租期/租金"
            ? "请完善租期与租金"
            : "请上传租赁合同";

      this.setData({
        previewSchedule: schedule,
        initialPayment: {
          firstRent: round2(firstRent),
          deposit: round2(deposit),
          calculatedTotal: round2(calculatedTotal),
          actualTotal: round2(actualTotal)
        },
        checkInSubmitDisabled: disabled,
        checkInSubmitText: submitText
      });
    },
    submitCheckIn() {
      if (this.data.checkInSubmitDisabled) return;
      const f = this.data.checkInForm;
      const deposit = Number(f.depositAmount || 0);
      const actualTotal = Number(this.data.initialPayment.actualTotal || 0);
      const firstTermPaid = Math.max(0, actualTotal - deposit);

      store.checkIn(this.data.roomId, {
        tenant: f.tenantName,
        phone: f.tenantPhone,
        idCard: f.idCard,
        leaseStart: dashToDot(f.leaseStart),
        leaseEnd: dashToDot(f.leaseEnd),
        rent: Number(f.rentAmount || 0),
        deposit,
        paymentCycle: Number(f.paymentCycle || 3),
        hasContract: !!f.contractUploaded,
        utilsInc: !!f.utilsInc,
        initWater: Number(f.initWater || 0),
        initElectric: Number(f.initElectric || 0),
        schedule: this.data.previewSchedule,
        firstPaidRent: round2(firstTermPaid)
      });

      wx.showToast({ title: "操作成功", icon: "success" });
      this.setData({ showCheckInModal: false });
      this.refresh();
      this.triggerEvent("changed");
    },

    /* Check-out modal */
    openCheckOut() {
      const room = this.data.room;
      this.setData(
        {
          showCheckOutModal: true,
          checkOutForm: {
            endWater: String(room.lastWater || 0),
            endElectric: String(room.lastElectric || 0),
            refundAmount: String(room.deposit || 0),
            remark: "正常到期退租"
          }
        },
        () => this.recalcCheckOut()
      );
    },
    closeCheckOut() {
      this.setData({ showCheckOutModal: false });
    },
    onOutWater(e) {
      this.setData({ "checkOutForm.endWater": e.detail.value || "" }, () => this.recalcCheckOut());
    },
    onOutElectric(e) {
      this.setData({ "checkOutForm.endElectric": e.detail.value || "" }, () => this.recalcCheckOut());
    },
    onOutRefund(e) {
      this.setData({ "checkOutForm.refundAmount": e.detail.value || "" });
    },
    onOutRemark(e) {
      this.setData({ "checkOutForm.remark": e.detail.value || "" });
    },
    outToggle() {
      wx.showToast({ title: "暂不支持切换", icon: "none" });
    },
    recalcCheckOut() {
      const room = this.data.room;
      if (!room || room.utilsInc) {
        this.setData({ outEstWater: 0, outEstElectric: 0 });
        return;
      }
      const w1 = Number(this.data.checkOutForm.endWater || room.lastWater || 0);
      const e1 = Number(this.data.checkOutForm.endElectric || room.lastElectric || 0);
      const wDiff = Math.max(0, w1 - Number(room.lastWater || 0));
      const eDiff = Math.max(0, e1 - Number(room.lastElectric || 0));
      this.setData({
        outEstWater: round2(wDiff * Number(room.waterPrice || 0)).toFixed(1),
        outEstElectric: round2(eDiff * Number(room.electricPrice || 0)).toFixed(1)
      });
    },
    submitCheckOut() {
      wx.showModal({
        title: "确认退租",
        content: "退租将清空该房间的租客信息、账单与交租计划。确认继续？",
        confirmText: "确认退租",
        confirmColor: "#f43f5e",
        success: (res) => {
          if (!res.confirm) return;
          store.checkOut(this.data.roomId, {
            endWater: Number(this.data.checkOutForm.endWater || 0),
            endElectric: Number(this.data.checkOutForm.endElectric || 0),
            refundAmount: Number(this.data.checkOutForm.refundAmount || 0),
            remark: this.data.checkOutForm.remark || ""
          });
          wx.showToast({ title: "操作成功", icon: "success" });
          this.setData({ showCheckOutModal: false });
          this.refresh();
          this.triggerEvent("changed");
        }
      });
    }
  }
});
