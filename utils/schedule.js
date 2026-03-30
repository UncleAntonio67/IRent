const { uid } = require("./id");
const {
  parseYMD,
  formatYMD,
  addMonthsSafe,
  addDays,
  diffDaysInclusive,
  isSameOrBefore
} = require("./date");

function roundMoney(n) {
  // Prototype uses 2 decimals; keep cents precision.
  const x = Number(n) || 0;
  return Math.round(x * 100) / 100;
}

/**
 * generateSchedule
 * 输入：起租日(startDate)、到期日(endDate)、交租周期(cycleMonths=3/6/12)、月租金(monthlyRent)。
 * 输出：PaymentTerm[]
 *
 * 约定：term 的 startDate/endDate 为闭区间；下一期从上一期 endDate + 1 天开始。
 * dueDate：默认等于本期 startDate（即期初应交）。
 */
function generateSchedule({ startDate, endDate, cycleMonths, monthlyRent }) {
  const d0 = typeof startDate === "string" ? parseYMD(startDate) : new Date(startDate);
  const dEnd = typeof endDate === "string" ? parseYMD(endDate) : new Date(endDate);
  const cycle = Number(cycleMonths);
  const rent = Number(monthlyRent);

  if (!d0 || !dEnd || !cycle || cycle <= 0 || !rent || rent <= 0) return [];
  if (!isSameOrBefore(d0, dEnd)) return [];

  let term = 1;
  const out = [];

  let dStart = new Date(d0);
  while (isSameOrBefore(dStart, dEnd)) {
    const nextStart = addMonthsSafe(dStart, cycle);
    let tEnd = addDays(nextStart, -1);
    const isTail = tEnd.getTime() > dEnd.getTime();
    if (isTail) tEnd = new Date(dEnd);

    let expectedAmount = rent * cycle;
    if (isTail) {
      const actualDays = diffDaysInclusive(dStart, tEnd);
      expectedAmount = (rent / 30) * actualDays;
    }

    out.push({
      id: uid("term"),
      term,
      startDate: formatYMD(dStart),
      endDate: formatYMD(tEnd),
      dueDate: formatYMD(dStart),
      expectedAmount: roundMoney(expectedAmount),
      paidAmount: 0,
      status: "unpaid"
    });

    term += 1;
    dStart = addDays(tEnd, 1);
  }

  return out;
}

module.exports = { generateSchedule };
