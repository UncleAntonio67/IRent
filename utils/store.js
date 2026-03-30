const { uid } = require("./id");
const storage = require("./storage");
const { formatYMDHM } = require("./date");
const { computeTermStatus } = require("./roomStatus");
const mock = require("./mock");

function getAppState() {
  const app = getApp();
  if (!app.globalData.state) app.globalData.state = { version: 1, properties: [] };
  return app.globalData.state;
}

function persist() {
  const app = getApp();
  if (typeof app.persist === "function") app.persist();
  else storage.safeSet("rent_manager_state_v1", app.globalData.state);
}

function walkRooms(state, fn) {
  for (const p of state.properties || []) {
    for (const b of p.blocks || []) {
      for (const f of b.floors || []) {
        for (const r of f.rooms || []) {
          fn(r, { property: p, block: b, floor: f });
        }
      }
    }
  }
}

function findRoomById(state, roomId) {
  for (let pi = 0; pi < (state.properties || []).length; pi++) {
    const p = state.properties[pi];
    for (let bi = 0; bi < (p.blocks || []).length; bi++) {
      const b = p.blocks[bi];
      for (let fi = 0; fi < (b.floors || []).length; fi++) {
        const f = b.floors[fi];
        for (let ri = 0; ri < (f.rooms || []).length; ri++) {
          const r = f.rooms[ri];
          if (r && r.id === roomId) {
            return { room: r, pi, bi, fi, ri };
          }
        }
      }
    }
  }
  return null;
}

function updateRoom(roomId, updater) {
  const state = getAppState();
  const hit = findRoomById(state, roomId);
  if (!hit) return false;
  const next = updater(hit.room);
  if (next && typeof next === "object") {
    state.properties[hit.pi].blocks[hit.bi].floors[hit.fi].rooms[hit.ri] = next;
  }
  persist();
  return true;
}

function deleteRoom(roomId) {
  const state = getAppState();
  const hit = findRoomById(state, roomId);
  if (!hit) return false;
  state.properties[hit.pi].blocks[hit.bi].floors[hit.fi].rooms.splice(hit.ri, 1);
  persist();
  return true;
}

function addHistory(room, { title, note }) {
  if (!room.history) room.history = [];
  room.history.unshift({
    id: uid("his"),
    at: formatYMDHM(new Date()),
    title,
    note: note || ""
  });
}

function verifyPaymentTerm(roomId, termId, paidAmount) {
  return updateRoom(roomId, (room) => {
    const term = (room.paymentSchedule || []).find((t) => t.id === termId);
    if (!term) return room;
    term.paidAmount = Math.round(Number(paidAmount || term.expectedAmount || 0) * 100) / 100;
    term.status = "paid";

    if (!room.bills) room.bills = [];
    room.bills.unshift({
      id: uid("bill"),
      month: `第${term.term}期租金`,
      type: "rent",
      rent: Number(term.paidAmount || 0),
      water: 0,
      electric: 0,
      deposit: 0,
      total: Number(term.paidAmount || 0),
      status: "paid",
      payDate: formatYMDHM(new Date())
    });

    addHistory(room, { title: "核销收款", note: `第${term.term}期租金 ¥${term.paidAmount}` });
    return room;
  });
}

function verifyBill(roomId, billId) {
  return updateRoom(roomId, (room) => {
    const bill = (room.bills || []).find((b) => b.id === billId);
    if (!bill) return room;
    bill.status = "paid";
    bill.payDate = formatYMDHM(new Date());

    if (bill.type === "utilities") {
      room.utilsAmount = Math.max(0, Number(room.utilsAmount || 0) - Number(bill.total || 0));
      room.utilsPaid = room.utilsAmount <= 0;
    }

    addHistory(room, { title: "核销收款", note: `${bill.month} ¥${bill.total}` });
    return room;
  });
}

function checkIn(roomId, payload) {
  const {
    tenant,
    phone,
    idCard,
    leaseStart,
    leaseEnd,
    rent,
    deposit,
    paymentCycle,
    hasContract,
    utilsInc,
    waterPrice,
    electricPrice,
    initWater,
    initElectric,
    schedule,
    firstPaidRent
  } = payload;

  return updateRoom(roomId, (room) => {
    room.tenant = tenant;
    room.phone = phone || "";
    room.idCard = idCard || "";
    room.lease = `${leaseStart} - ${leaseEnd}`;
    room.hasContract = !!hasContract;

    room.rent = Number(rent || 0);
    room.deposit = Number(deposit || 0);
    room.paymentCycle = Number(paymentCycle || 3);

    room.utilsInc = !!utilsInc;
    room.waterPrice = Number(waterPrice || room.waterPrice || 0);
    room.electricPrice = Number(electricPrice || room.electricPrice || 0);
    room.lastWater = Number(initWater || 0);
    room.lastElectric = Number(initElectric || 0);
    room.utilsAmount = 0;
    room.utilsPaid = true;

    room.paymentSchedule = Array.isArray(schedule) ? schedule : [];
    if (room.paymentSchedule[0]) {
      const expected = Number(room.paymentSchedule[0].expectedAmount || 0);
      const paid = Math.round(Number(firstPaidRent || 0) * 100) / 100;
      room.paymentSchedule[0].paidAmount = paid;
      room.paymentSchedule[0].status = paid >= expected ? "paid" : "unpaid";
    }

    room.bills = room.bills || [];
    const paidRent = room.paymentSchedule[0] ? room.paymentSchedule[0].paidAmount : 0;
    const paidDeposit = Number(deposit || 0);
    room.bills.unshift({
      id: uid("bill"),
      month: "首期租金+押金",
      type: "deposit_rent",
      rent: paidRent,
      water: 0,
      electric: 0,
      deposit: paidDeposit,
      total: Math.round((paidRent + paidDeposit) * 100) / 100,
      status: "paid",
      payDate: formatYMDHM(new Date())
    });

    addHistory(room, { title: "办理入住", note: `租客：${tenant}` });
    return room;
  });
}

function createUtilitiesBill(roomId, payload) {
  const { currentWater, currentElectric, photoCount = 0 } = payload;
  return updateRoom(roomId, (room) => {
    const w0 = Number(room.lastWater || 0);
    const e0 = Number(room.lastElectric || 0);
    const w1 = Number(currentWater || 0);
    const e1 = Number(currentElectric || 0);
    const wDelta = Math.max(0, w1 - w0);
    const eDelta = Math.max(0, e1 - e0);

    const water = Math.round(wDelta * Number(room.waterPrice || 0) * 100) / 100;
    const electric = Math.round(eDelta * Number(room.electricPrice || 0) * 100) / 100;
    const total = Math.round((water + electric) * 100) / 100;

    room.lastWater = w1;
    room.lastElectric = e1;
    room.utilsAmount = Number(room.utilsAmount || 0) + total;
    room.utilsPaid = false;

    room.bills = room.bills || [];
    const m = new Date();
    const month = `${m.getFullYear()}年${m.getMonth() + 1}月杂费`;
    room.bills.unshift({
      id: uid("bill"),
      month,
      type: "utilities",
      rent: 0,
      water,
      electric,
      deposit: 0,
      total,
      status: "unpaid",
      payDate: ""
    });

    addHistory(room, {
      title: "抄表算账",
      note: `水¥${water} 电¥${electric}${photoCount ? ` (照片x${photoCount})` : ""}`
    });
    return room;
  });
}

function checkOut(roomId, payload) {
  const { endWater, endElectric, refundAmount, remark, note } = payload || {};
  return updateRoom(roomId, (room) => {
    // Best-effort tail utils estimate (not persisted as a bill here).
    let tailUtils = 0;
    if (!room.utilsInc) {
      const w1 = Number(endWater || room.lastWater || 0);
      const e1 = Number(endElectric || room.lastElectric || 0);
      const wDiff = Math.max(0, w1 - Number(room.lastWater || 0));
      const eDiff = Math.max(0, e1 - Number(room.lastElectric || 0));
      tailUtils =
        Math.round((wDiff * Number(room.waterPrice || 0) + eDiff * Number(room.electricPrice || 0)) * 100) /
        100;
      room.lastWater = w1;
      room.lastElectric = e1;
    }

    const mergedRemark = remark || note || "";
    const noteText =
      `退租结算完成。` +
      (tailUtils > 0 ? `尾期水电 ¥${tailUtils.toFixed(2)}。` : "") +
      (typeof refundAmount === "number" ? `退还 ¥${refundAmount.toFixed(2)}。` : "") +
      (mergedRemark ? `备注: ${mergedRemark}` : "");

    addHistory(room, { title: "办理退租", note: noteText });

    room.status = "empty";
    room.tenant = null;
    room.phone = "";
    room.idCard = "";
    room.lease = "";
    room.hasContract = false;
    room.deposit = 0;

    room.utilsAmount = 0;
    room.utilsPaid = true;
    room.paymentSchedule = [];
    room.bills = [];

    return room;
  });
}

function derivePendingItems(now = new Date()) {
  const state = getAppState();
  const items = [];

  walkRooms(state, (room) => {
    if (!room) return;

    for (const t of room.paymentSchedule || []) {
      const status = computeTermStatus(t, now);
      if (status === "paid") continue;
      // Prototype: only show actionable (due soon / overdue).
      if (status !== "due_soon" && status !== "overdue") continue;
      const remaining = Math.max(0, Number(t.expectedAmount || 0) - Number(t.paidAmount || 0));
      if (remaining <= 0) continue;
      items.push({
        id: `term_${t.id}`,
        kind: "term",
        roomId: room.id,
        roomNo: room.roomNo,
        title: `第${t.term}期租金`,
        dueDate: t.dueDate,
        amount: remaining,
        status,
        termId: t.id
      });
    }

    for (const b of room.bills || []) {
      if (!b || b.status === "paid") continue;
      items.push({
        id: `bill_${b.id}`,
        kind: "bill",
        roomId: room.id,
        roomNo: room.roomNo,
        title: b.month,
        dueDate: "",
        amount: Number(b.total || 0),
        status: "overdue",
        billId: b.id
      });
    }
  });

  items.sort((a, b) => {
    const ad = a.dueDate || "9999.12.31";
    const bd = b.dueDate || "9999.12.31";
    return ad.localeCompare(bd);
  });

  return items;
}

function derivePaidBills() {
  const state = getAppState();
  const out = [];
  walkRooms(state, (room) => {
    for (const b of room.bills || []) {
      if (b && b.status === "paid") {
        out.push({
          ...b,
          roomId: room.id,
          roomNo: room.roomNo
        });
      }
    }
  });

  out.sort((a, b) => (b.payDate || "").localeCompare(a.payDate || ""));
  return out;
}

function calcYearTotals(year) {
  const paid = derivePaidBills();
  let total = 0;
  for (const b of paid) {
    if (typeof b.payDate === "string" && b.payDate.startsWith(`${year}.`)) {
      total += Number(b.total || 0);
    }
  }
  return total;
}

module.exports = {
  getAppState,
  persist,
  findRoomById,
  updateRoom,
  deleteRoom,
  addProperty,
  addBlock,
  addFloor,
  addRoom,
  verifyPaymentTerm,
  verifyBill,
  checkIn,
  createUtilitiesBill,
  checkOut,
  derivePendingItems,
  derivePaidBills,
  calcYearTotals,
  walkRooms
};

function addProperty({ name }) {
  const state = getAppState();
  if (!state.properties) state.properties = [];
  state.properties.push({
    id: uid("prop"),
    name: name || `新院落${state.properties.length + 1}`,
    blocks: []
  });
  persist();
  return true;
}

function addBlock({ propertyId, name }) {
  const state = getAppState();
  const p = (state.properties || []).find((x) => x.id === propertyId) || state.properties[0];
  if (!p) return false;
  if (!p.blocks) p.blocks = [];
  p.blocks.push({
    id: uid("blk"),
    name: name || `新楼栋${p.blocks.length + 1}`,
    floors: []
  });
  persist();
  return true;
}

function addFloor({ propertyId, blockId, floorNo }) {
  const state = getAppState();
  const p = (state.properties || []).find((x) => x.id === propertyId) || state.properties[0];
  if (!p) return false;
  const b = (p.blocks || []).find((x) => x.id === blockId) || p.blocks[0];
  if (!b) return false;
  if (!b.floors) b.floors = [];
  const nextFloor = Number(
    floorNo || (b.floors.length ? Math.max(...b.floors.map((f) => f.floor)) + 1 : 1)
  );
  b.floors.push({ floor: nextFloor, rooms: [] });
  b.floors.sort((a, c) => a.floor - c.floor);
  persist();
  return true;
}

function addRoom({ propertyId, blockId, floorNo, roomNo }) {
  const state = getAppState();
  const p = (state.properties || []).find((x) => x.id === propertyId) || state.properties[0];
  if (!p) return false;
  const b = (p.blocks || []).find((x) => x.id === blockId) || p.blocks[0];
  if (!b) return false;
  const f = (b.floors || []).find((x) => x.floor === Number(floorNo)) || b.floors[0];
  if (!f) return false;
  if (!f.rooms) f.rooms = [];
  const rn = roomNo || `${f.floor}${String(f.rooms.length + 1).padStart(2, "0")}`;
  f.rooms.push(mock.emptyRoom({ roomNo: rn }));
  f.rooms[f.rooms.length - 1].id = uid("room");
  persist();
  return true;
}
