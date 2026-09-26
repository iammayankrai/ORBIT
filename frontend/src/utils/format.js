export function inr(crValue) {
  const abs = Math.abs(crValue)
  const sign = crValue < 0 ? '-' : ''
  if (abs >= 1) return `${sign}₹${abs.toFixed(abs >= 10 ? 1 : 2)} Cr`
  return `${sign}₹${Math.round(abs * 100)} L`
}

export function pct(value, { signed = false, decimals = 1 } = {}) {
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function num(value) {
  return new Intl.NumberFormat('en-IN').format(Math.round(value))
}

export function compactNum(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return `${value}`
}

// Charts render arbitrary detected measures (revenue, quantity, a margin
// %, ...), so callers pass the backend-provided `unit` instead of a chart
// hardcoding one formatter.
export function formatByUnit(value, unit) {
  if (unit === 'cr') return inr(value)
  if (unit === 'pct') return pct(value)
  return num(value)
}
