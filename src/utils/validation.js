export function isValidMainlandPhone(phone) {
  return /^1\d{10}$/.test(String(phone || '').trim())
}

export function parsePositiveAmount(value) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function parseNonNegativeNumber(value) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

export function parsePositiveInteger(value) {
  const amount = Number(value)
  return Number.isInteger(amount) && amount > 0 ? amount : null
}
