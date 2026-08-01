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

// Accept common manual date formats and always persist the canonical ISO form.
export function normalizeDateInput(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const compact = raw.match(/^(\d{4})(\d{2})(\d{2})$/)
  const parts = compact ? [compact[1], compact[2], compact[3]] : raw.split(/[./-]/)
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) return null
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (year < 1900 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
