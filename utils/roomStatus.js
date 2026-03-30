const { parseYMD, toDateOnly, daysUntil, isAfter } = require("./date");

function computeTermStatus(term, now = new Date()) {
  if (!term) return "unpaid";
  if ((term.paidAmount || 0) >= (term.expectedAmount || 0)) return "paid";

  const due = parseYMD(term.dueDate);
  if (!due) return "unpaid";

  const today = toDateOnly(now);
  if (isAfter(today, due)) return "overdue";

  const d = daysUntil(today, due);
  if (d >= 0 && d <= 7) return "due_soon";
  return "unpaid";
}

function computeRoomStatus(room, now = new Date()) {
  if (!room || !room.tenant) return "empty";

  // Utilities: any unpaid utilities -> overdue (PRD: 抄表生成杂费单后房间变为 overdue)
  const unpaidUtils = (room.bills || []).some(
    (b) => b && b.type === "utilities" && b.status === "unpaid"
  );
  if (unpaidUtils) return "overdue";

  let hasOverdue = false;
  let hasDueSoon = false;

  for (const t of room.paymentSchedule || []) {
    const s = computeTermStatus(t, now);
    if (s === "overdue") hasOverdue = true;
    if (s === "due_soon") hasDueSoon = true;
  }

  if (hasOverdue) return "overdue";
  if (hasDueSoon) return "due_soon";
  return "rented";
}

module.exports = { computeTermStatus, computeRoomStatus };

