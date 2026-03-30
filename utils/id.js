function uid(prefix = "id") {
  const a = Date.now().toString(36);
  const b = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${a}_${b}`;
}

module.exports = { uid };

