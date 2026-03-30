function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateOnly(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseYMD(s) {
  // Expect "YYYY.MM.DD"
  if (!s || typeof s !== "string") return null;
  const m = s.trim().match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const d = new Date(y, mo, da);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatYMD(d) {
  const x = new Date(d);
  return `${x.getFullYear()}.${pad2(x.getMonth() + 1)}.${pad2(x.getDate())}`;
}

function formatYMDHM(d) {
  const x = new Date(d);
  return `${formatYMD(x)} ${pad2(x.getHours())}:${pad2(x.getMinutes())}`;
}

function lastDayOfMonth(y, m0) {
  return new Date(y, m0 + 1, 0).getDate();
}

function addMonthsSafe(d, months) {
  const x = toDateOnly(d);
  const y = x.getFullYear();
  const m0 = x.getMonth();
  const day = x.getDate();

  const targetM0 = m0 + months;
  const ty = y + Math.floor(targetM0 / 12);
  const tm0 = ((targetM0 % 12) + 12) % 12;
  const td = Math.min(day, lastDayOfMonth(ty, tm0));
  return new Date(ty, tm0, td);
}

function addDays(d, days) {
  const x = toDateOnly(d);
  x.setDate(x.getDate() + days);
  return x;
}

function diffDaysInclusive(start, end) {
  const a = toDateOnly(start);
  const b = toDateOnly(end);
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / 86400000) + 1;
}

function isSameOrBefore(a, b) {
  return toDateOnly(a).getTime() <= toDateOnly(b).getTime();
}

function isAfter(a, b) {
  return toDateOnly(a).getTime() > toDateOnly(b).getTime();
}

function daysUntil(a, b) {
  // b - a in days (date-only)
  const x = toDateOnly(a).getTime();
  const y = toDateOnly(b).getTime();
  return Math.round((y - x) / 86400000);
}

module.exports = {
  parseYMD,
  formatYMD,
  formatYMDHM,
  addMonthsSafe,
  addDays,
  diffDaysInclusive,
  isSameOrBefore,
  isAfter,
  daysUntil,
  toDateOnly
};

