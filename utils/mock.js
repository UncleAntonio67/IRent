const { uid } = require("./id");
const { formatYMD, formatYMDHM } = require("./date");
const { generateSchedule } = require("./schedule");

function emptyRoom({ roomNo, rent = 2600, deposit = 2600, paymentCycle = 3 } = {}) {
  return {
    id: uid("room"),
    roomNo,
    status: "empty",
    tenant: null,
    phone: "",
    idCard: "",
    lease: "",
    hasContract: false,
    rent,
    deposit,
    paymentCycle,
    utilsInc: false,
    waterPrice: 4,
    electricPrice: 1.2,
    lastWater: 0,
    lastElectric: 0,
    utilsAmount: 0,
    utilsPaid: true,
    paymentSchedule: [],
    bills: [],
    history: []
  };
}

function rentedRoom({
  roomNo,
  tenant,
  phone,
  idCard,
  startDate,
  endDate,
  rent,
  deposit,
  paymentCycle,
  hasContract = true
}) {
  const schedule = generateSchedule({
    startDate,
    endDate,
    cycleMonths: paymentCycle,
    monthlyRent: rent
  });

  // Mark first term paid by default for demo.
  if (schedule[0]) {
    schedule[0].paidAmount = schedule[0].expectedAmount;
    schedule[0].status = "paid";
  }

  const bills = [
    {
      id: uid("bill"),
      month: "首期租金+押金",
      type: "deposit_rent",
      rent: schedule[0] ? schedule[0].expectedAmount : rent,
      water: 0,
      electric: 0,
      deposit,
      total: (schedule[0] ? schedule[0].expectedAmount : rent) + deposit,
      status: "paid",
      payDate: formatYMDHM(new Date())
    }
  ];

  return {
    id: uid("room"),
    roomNo,
    status: "rented",
    tenant,
    phone,
    idCard,
    lease: `${startDate} - ${endDate}`,
    hasContract,
    rent,
    deposit,
    paymentCycle,
    utilsInc: false,
    waterPrice: 4,
    electricPrice: 1.2,
    lastWater: 120,
    lastElectric: 880,
    utilsAmount: 0,
    utilsPaid: true,
    paymentSchedule: schedule,
    bills,
    history: [
      {
        id: uid("his"),
        at: formatYMDHM(new Date()),
        title: "办理入住",
        note: `租客：${tenant}`
      }
    ]
  };
}

function createInitialState() {
  // Mirror the prototype (原型.txt) so UI states are visible immediately.
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayDot = `${y}.${m}.${d}`;

  function dotAddDays(days) {
    const x = new Date(now);
    x.setDate(x.getDate() + days);
    const yy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  }

  const N301 = rentedRoom({
    roomNo: "北301",
    tenant: "张总",
    phone: "13800138000",
    idCard: "440301198001015678",
    startDate: `${y - 1}.10.01`,
    endDate: `${y}.09.30`,
    rent: 3500,
    deposit: 7000,
    paymentCycle: 6,
    hasContract: true
  });
  // Force due_soon by making a future due date within 7 days.
  if (N301.paymentSchedule[1]) {
    N301.paymentSchedule[1].paidAmount = 0;
    N301.paymentSchedule[1].status = "unpaid";
    N301.paymentSchedule[1].dueDate = dotAddDays(3);
  }

  const N302 = emptyRoom({ roomNo: "北302", rent: 3200, deposit: 0, paymentCycle: 3 });
  N302.lastWater = 150;
  N302.lastElectric = 500;
  N302.waterPrice = 5.5;
  N302.electricPrice = 1.2;
  N302.history = [
    { id: uid("his"), at: formatYMDHM(now), title: "空置中", note: "房屋空置保洁中，随时可租" }
  ];

  const N201 = rentedRoom({
    roomNo: "北201",
    tenant: "李女士",
    phone: "13900139000",
    idCard: "42010219950808123X",
    startDate: `${y - 1}.06.15`,
    endDate: `${y}.06.14`,
    rent: 2800,
    deposit: 5600,
    paymentCycle: 3,
    hasContract: true
  });
  // Force overdue term
  const lastTerm = N201.paymentSchedule[N201.paymentSchedule.length - 1];
  if (lastTerm) {
    lastTerm.paidAmount = 0;
    lastTerm.status = "unpaid";
    lastTerm.dueDate = dotAddDays(-10);
  }
  // Add unpaid utilities bill
  N201.lastWater = 180;
  N201.lastElectric = 600;
  N201.waterPrice = 5.5;
  N201.electricPrice = 1.2;
  N201.utilsAmount = 286;
  N201.utilsPaid = false;
  N201.bills.unshift({
    id: uid("bill"),
    month: `${y}年${now.getMonth() + 1}月杂费`,
    type: "utilities",
    rent: 0,
    water: 66,
    electric: 220,
    deposit: 0,
    total: 286,
    status: "unpaid",
    payDate: ""
  });

  const N202 = rentedRoom({
    roomNo: "北202",
    tenant: "王教授",
    phone: "13700137000",
    idCard: "110105197811114321",
    startDate: `${y - 1}.01.01`,
    endDate: `${y + 1}.12.31`,
    rent: 3000,
    deposit: 6000,
    paymentCycle: 12,
    hasContract: true
  });
  N202.utilsInc = true;
  N202.lastWater = 0;
  N202.lastElectric = 0;

  const A201 = rentedRoom({
    roomNo: "A201",
    tenant: "陈同学",
    phone: "15800158001",
    idCard: "330102200105051234",
    startDate: `${y - 1}.09.01`,
    endDate: `${y}.08.31`,
    rent: 1500,
    deposit: 1500,
    paymentCycle: 3,
    hasContract: true
  });
  A201.lastWater = 45;
  A201.lastElectric = 110;
  A201.waterPrice = 5;
  A201.electricPrice = 1.5;

  const A202 = rentedRoom({
    roomNo: "A202",
    tenant: "黄先生",
    phone: "15900159002",
    idCard: "",
    startDate: `${y}.01.10`,
    endDate: `${y}.07.09`,
    rent: 1600,
    deposit: 1600,
    paymentCycle: 1,
    hasContract: false
  });
  // Make overdue + unpaid utilities
  if (A202.paymentSchedule[2]) {
    A202.paymentSchedule[2].paidAmount = 0;
    A202.paymentSchedule[2].status = "unpaid";
    A202.paymentSchedule[2].dueDate = dotAddDays(-8);
  }
  A202.lastWater = 20;
  A202.lastElectric = 85;
  A202.waterPrice = 5;
  A202.electricPrice = 1.5;
  A202.utilsAmount = 110;
  A202.utilsPaid = false;
  A202.bills.unshift({
    id: uid("bill"),
    month: `${y}年${now.getMonth() + 1}月杂费`,
    type: "utilities",
    rent: 0,
    water: 30,
    electric: 80,
    deposit: 0,
    total: 110,
    status: "unpaid",
    payDate: ""
  });

  const A101 = rentedRoom({
    roomNo: "A101(临街)",
    tenant: "便利店",
    phone: "13300133000",
    idCard: "",
    startDate: `${y - 2}.03.01`,
    endDate: `${y + 3}.02.28`,
    rent: 4500,
    deposit: 9000,
    paymentCycle: 6,
    hasContract: true
  });
  A101.lastWater = 500;
  A101.lastElectric = 1200;
  A101.waterPrice = 6;
  A101.electricPrice = 1.8;

  return {
    version: 1,
    landlord: {
      name: "职业房东",
      phone: "400-000-0000",
      createdAt: formatYMD(new Date())
    },
    properties: [
      {
        id: uid("prop"),
        name: "江南别院(高端)",
        blocks: [
          {
            id: uid("blk"),
            name: "北房主楼",
            floors: [
              { floor: 3, rooms: [N301, N302] },
              { floor: 2, rooms: [N201, N202] }
            ]
          }
        ]
      },
      {
        id: uid("prop"),
        name: "星光青年社区",
        blocks: [
          {
            id: uid("blk"),
            name: "A栋(白领公寓)",
            floors: [
              { floor: 2, rooms: [A201, A202] },
              { floor: 1, rooms: [A101] }
            ]
          }
        ]
      }
    ]
  };
}

module.exports = { createInitialState };

// Export factories for edit-mode quick adds.
module.exports.emptyRoom = emptyRoom;
module.exports.rentedRoom = rentedRoom;
