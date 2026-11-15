// Number / date formatting shared by every dashboard component. Money is shown
// the Indian way (₹ with L / Cr), matching the backend's own formatting.

const IN = new Intl.NumberFormat('en-IN')
const DAY_MS = 86_400_000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const fmtInt = (v) => IN.format(Math.round(v))

function scaled(abs, decimals = 2) {
  if (abs >= 1e7) return `${(abs / 1e7).toFixed(abs >= 1e8 ? 1 : decimals)} Cr`
  if (abs >= 1e5) return `${(abs / 1e5).toFixed(decimals)} L`
  return null
}

export function fmtMoney(v) {
  if (!Number.isFinite(v)) return '—'
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  const s = scaled(abs)
  if (s) return `${sign}₹${s}`
  if (abs >= 1000) return `${sign}₹${IN.format(Math.round(abs))}`
  return `${sign}₹${abs.toFixed(abs >= 100 ? 0 : 2)}`
}

export function fmtNumber(v) {
  if (!Number.isFinite(v)) return '—'
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  const s = scaled(abs)
  if (s) return `${sign}${s}`
  if (abs >= 1000) return `${sign}${IN.format(Math.round(abs))}`
  if (abs >= 100) return `${sign}${abs.toFixed(0)}`
  if (abs >= 10) return `${sign}${abs.toFixed(1)}`
  return `${sign}${abs.toFixed(2).replace(/\.?0+$/, '') || '0'}`
}

export function fmtPct(v, decimals = 1) {
  return Number.isFinite(v) ? `${v.toFixed(decimals)}%` : '—'
}

export function fmtValue(v, unit) {
  if (unit === 'inr') return fmtMoney(v)
  if (unit === 'pct') return fmtPct(v)
  if (unit === 'frac') return fmtPct(v * 100)
  return fmtNumber(v)
}

// Short form for chart axes — no currency glyph, fewer decimals.
export function fmtAxis(v, unit) {
  if (!Number.isFinite(v)) return ''
  if (unit === 'pct') return `${Math.round(v)}%`
  if (unit === 'frac') return `${Math.round(v * 100)}%`
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  const trim = (s) => s.replace(/\.0$/, '')
  if (abs >= 1e7) return `${sign}${trim((abs / 1e7).toFixed(abs >= 1e8 ? 0 : 1))}Cr`
  if (abs >= 1e5) return `${sign}${trim((abs / 1e5).toFixed(abs >= 1e6 ? 0 : 1))}L`
  if (abs >= 1e3) return `${sign}${trim((abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1))}k`
  return `${sign}${abs >= 10 ? Math.round(abs) : trim(abs.toFixed(1))}`
}

export function fmtDelta(pct) {
  if (pct == null || !Number.isFinite(pct)) return null
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(Math.abs(pct) >= 100 ? 0 : 1)}%`
}

export const dayToDate = (day) => new Date(day * DAY_MS)
export const dateToDay = (d) => Math.floor(d.getTime() / DAY_MS)

export function fmtDay(day, withYear = true) {
  if (day == null || !Number.isFinite(day)) return ''
  const d = dayToDate(day)
  const base = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
  return withYear ? `${base} ${d.getUTCFullYear()}` : base
}

export function fmtIso(day) {
  if (day == null || !Number.isFinite(day)) return ''
  return dayToDate(day).toISOString().slice(0, 10)
}

export function isoToDay(iso) {
  const t = Date.parse(`${iso}T00:00:00Z`)
  return Number.isFinite(t) ? Math.floor(t / DAY_MS) : null
}

export function bucketLabel(day, grain) {
  const d = dayToDate(day)
  const yy = String(d.getUTCFullYear()).slice(2)
  if (grain === 'year') return `${d.getUTCFullYear()}`
  if (grain === 'quarter') return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ’${yy}`
  if (grain === 'month') return `${MONTHS[d.getUTCMonth()]} ’${yy}`
  return fmtDay(day, false)
}
