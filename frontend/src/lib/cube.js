// The in-browser analytics engine behind the dashboard workspace.
//
// The backend ships a dataset once, in a compact columnar layout. Everything
// the dashboard shows after that - KPIs, trends, breakdowns, cross-filtering,
// period comparison - is computed here, instantly, with no further requests.
//
// A "filter state" is { range: [loDay, hiDay] | null, dims: { [dimName]: Set<code> } }
// where days are epoch days (days since 1970-01-01).

import { bucketLabel, fmtIso } from './fmt.js'

export const ROWS_MEASURE = 'Records'
const GRAINS = [
  { id: 'day', size: 1 },
  { id: 'week', size: 7 },
  { id: 'month', size: 30 },
  { id: 'quarter', size: 91 },
  { id: 'year', size: 365 },
]

// -------------------------------------------------------------------------
// Building
// -------------------------------------------------------------------------

export function buildCube(ds) {
  const n = ds.n
  const dates = ds.date ? Float64Array.from(ds.date.values, (v) => (v == null ? NaN : v)) : null

  const measures = ds.measures.map((m) => ({
    name: m.name,
    role: m.role,
    unit: m.unit,
    agg: m.agg,
    values: Float64Array.from(m.values, (v) => (v == null ? NaN : v)),
  }))
  // Always-available row count, so even a file with no numeric columns has
  // something to chart.
  measures.push({ name: ROWS_MEASURE, role: 'count', unit: 'number', agg: 'sum', synthetic: true, values: new Float64Array(n).fill(1) })

  const dimensions = ds.dimensions.map((d) => ({
    name: d.name,
    role: d.role,
    dict: d.dict.map((s) => s ?? '(blank)'),
    codes: Int32Array.from(d.codes),
  }))

  let dateMin = null
  let dateMax = null
  let granularity = 1
  if (dates) {
    let lo = Infinity
    let hi = -Infinity
    for (let i = 0; i < n; i++) {
      const v = dates[i]
      if (v !== v) continue
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
    if (Number.isFinite(lo)) {
      dateMin = lo
      dateMax = hi
      const uniq = [...new Set(Array.from(dates).filter((v) => v === v))].sort((a, b) => a - b)
      let minStep = Infinity
      for (let i = 1; i < uniq.length; i++) minStep = Math.min(minStep, uniq[i] - uniq[i - 1])
      granularity = Number.isFinite(minStep) ? minStep : 1
    }
  }

  return {
    n,
    totalRows: ds.total_rows ?? n,
    sampled: Boolean(ds.sampled),
    dates,
    dateName: ds.date?.name ?? null,
    dateMin,
    dateMax,
    granularity,
    measures,
    dimensions,
    extras: ds.extras,
    columns: ds.columns,
    profile: ds.profile,
    bucketCache: new Map(),
  }
}

export const hasDates = (cube) => cube.dates != null && cube.dateMin != null
export const realMeasures = (cube) => cube.measures.filter((m) => !m.synthetic)
export const findMeasure = (cube, name) => cube.measures.find((m) => m.name === name) ?? cube.measures[0]
export const findDim = (cube, name) => cube.dimensions.find((d) => d.name === name)

// Lower is better for these — drives colouring of deltas and insight tone.
const LOWER_IS_BETTER = /cost|delay|reject|downtime|exit|absence|overdue|outstanding|aged|attrition|turnaround|days to|expense|defect|return/i
export const lowerIsBetter = (m) => m.role === 'cost' || LOWER_IS_BETTER.test(m.name)

const ROLE_PRIORITY = ['revenue', 'profit', 'quantity', 'cost']
// "Planned Qty" is a target, not the thing that actually happened.
const NOT_ACTUAL = /plan|budget|target|forecast|opening|reorder/i
export function pickPrimary(cube) {
  const real = realMeasures(cube)
  for (const role of ROLE_PRIORITY) {
    const same = real.filter((x) => x.role === role)
    const m = same.find((x) => !NOT_ACTUAL.test(x.name)) ?? same[0]
    if (m) return m
  }
  return real.find((x) => !NOT_ACTUAL.test(x.name)) ?? real[0] ?? cube.measures[0]
}

const DIM_PRIORITY = ['region', 'location', 'category', 'product', 'entity', 'customer', 'dimension']
export function rankedDimensions(cube) {
  return [...cube.dimensions].sort((a, b) => {
    const ra = DIM_PRIORITY.indexOf(a.role)
    const rb = DIM_PRIORITY.indexOf(b.role)
    return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb)
  })
}

// -------------------------------------------------------------------------
// Date ranges
// -------------------------------------------------------------------------

export function effectiveRange(cube, filters) {
  if (!hasDates(cube)) return null
  return filters?.range ?? [cube.dateMin, cube.dateMax]
}

export const spanDays = (cube) => (hasDates(cube) ? cube.dateMax - cube.dateMin + 1 : 0)

// Start a window on a whole month where that costs at most a month, so the
// first bucket of a monthly chart isn't a one-day stub.
function snapToMonthStart(lo, win) {
  if (win < 60) return lo
  const d = new Date(lo * 86_400_000)
  if (d.getUTCDate() === 1) return lo
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) / 86_400_000
  return next - lo <= 31 ? next : lo
}

// Pick a default window that leaves room for a like-for-like prior period.
export function defaultRange(cube) {
  if (!hasDates(cube)) return null
  const span = spanDays(cube)
  let win = null
  if (span >= 540) win = 365
  else if (span >= 120) win = Math.floor(span / 2)
  if (!win) return null
  return [snapToMonthStart(cube.dateMax - win + 1, win), cube.dateMax]
}

export function rangePresets(cube) {
  if (!hasDates(cube)) return []
  const span = spanDays(cube)
  const out = [{ id: 'all', label: 'All', range: null }]
  for (const [id, label, days] of [
    ['12m', '12M', 365],
    ['6m', '6M', 183],
    ['3m', '3M', 91],
    ['1m', '1M', 30],
  ]) {
    if (days < span * 0.9 && days >= cube.granularity) out.push({ id, label, range: [snapToMonthStart(cube.dateMax - days + 1, days), cube.dateMax] })
  }
  return out
}

// -------------------------------------------------------------------------
// Masks
// -------------------------------------------------------------------------

export function makeMask(cube, filters, { skipDim = null, range } = {}) {
  const { n } = cube
  const mask = new Uint8Array(n).fill(1)
  const r = range !== undefined ? range : filters?.range
  if (r && cube.dates) {
    const [lo, hi] = r
    for (let i = 0; i < n; i++) {
      const d = cube.dates[i]
      if (!(d >= lo && d <= hi)) mask[i] = 0
    }
  }
  const dimFilters = filters?.dims ?? {}
  for (const dim of cube.dimensions) {
    const sel = dimFilters[dim.name]
    if (!sel || sel.size === 0 || dim.name === skipDim) continue
    const codes = dim.codes
    for (let i = 0; i < n; i++) {
      if (mask[i] && !sel.has(codes[i])) mask[i] = 0
    }
  }
  return mask
}

export function countMask(mask) {
  let c = 0
  for (let i = 0; i < mask.length; i++) c += mask[i]
  return c
}

export function hasActiveFilters(cube, filters) {
  return Object.values(filters?.dims ?? {}).some((s) => s && s.size > 0)
}

// -------------------------------------------------------------------------
// Aggregation core
// -------------------------------------------------------------------------

// keyFn(i) -> group key (or undefined to skip the row).
// snapKeyFn(i) -> which "time bucket" a row belongs to, so that snapshot
// measures (stock, headcount...) take the latest snapshot per bucket
// instead of summing every month's balance.
function groupAgg(cube, mask, measure, keyFn, snapKeyFn = () => 0) {
  const vals = measure.values
  const dates = cube.dates
  const snap = measure.agg === 'snapshot' && dates
  let lastBy = null
  if (snap) {
    lastBy = new Map()
    for (let i = 0; i < cube.n; i++) {
      if (!mask[i]) continue
      const v = vals[i]
      const d = dates[i]
      if (v !== v || d !== d) continue
      const sk = snapKeyFn(i)
      const cur = lastBy.get(sk)
      if (cur === undefined || d > cur) lastBy.set(sk, d)
    }
  }
  const out = new Map()
  for (let i = 0; i < cube.n; i++) {
    if (!mask[i]) continue
    const v = vals[i]
    if (v !== v) continue
    if (snap && dates[i] !== lastBy.get(snapKeyFn(i))) continue
    const k = keyFn(i)
    if (k === undefined) continue
    let acc = out.get(k)
    if (!acc) out.set(k, (acc = { sum: 0, count: 0 }))
    acc.sum += v
    acc.count++
  }
  return out
}

const finish = (acc, measure) => (!acc || acc.count === 0 ? 0 : measure.agg === 'avg' ? acc.sum / acc.count : acc.sum)

export function aggregate(cube, mask, measure) {
  return finish(groupAgg(cube, mask, measure, () => 0).get(0), measure)
}

export function groupBy(cube, mask, dim, measure) {
  const codes = dim.codes
  const res = groupAgg(cube, mask, measure, (i) => (codes[i] < 0 ? undefined : codes[i]))
  const out = []
  for (const [code, acc] of res) out.push({ code, name: dim.dict[code], value: finish(acc, measure), count: acc.count })
  return out.sort((a, b) => b.value - a.value)
}

// -------------------------------------------------------------------------
// Time series
// -------------------------------------------------------------------------

export function allowedGrains(cube) {
  if (!hasDates(cube)) return []
  const span = spanDays(cube)
  return GRAINS.filter((g) => g.size >= cube.granularity * 0.9 && (g.id === 'day' ? span <= 400 : true) && (g.id === 'year' ? span >= 700 : true)).map((g) => g.id)
}

export function autoGrain(cube, range) {
  const span = range ? range[1] - range[0] + 1 : spanDays(cube)
  const allowed = allowedGrains(cube)
  const want = span <= 62 ? 'day' : span <= 220 ? 'week' : span <= 1200 ? 'month' : 'quarter'
  if (allowed.includes(want)) return want
  // Fall back to the finest grain the data supports.
  const order = GRAINS.map((g) => g.id)
  return allowed.find((g) => order.indexOf(g) >= order.indexOf(want)) ?? allowed[allowed.length - 1] ?? 'month'
}

function bucketStart(day, grain) {
  if (grain === 'day') return day
  if (grain === 'week') return day - ((((day + 3) % 7) + 7) % 7)
  const d = new Date(day * 86_400_000)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  if (grain === 'month') return Date.UTC(y, m, 1) / 86_400_000
  if (grain === 'quarter') return Date.UTC(y, m - (m % 3), 1) / 86_400_000
  return Date.UTC(y, 0, 1) / 86_400_000
}

export function bucketKeys(cube, grain) {
  const hit = cube.bucketCache.get(grain)
  if (hit) return hit
  const keys = new Float64Array(cube.n).fill(NaN)
  const memo = new Map()
  for (let i = 0; i < cube.n; i++) {
    const d = cube.dates[i]
    if (d !== d) continue
    let k = memo.get(d)
    if (k === undefined) memo.set(d, (k = bucketStart(d, grain)))
    keys[i] = k
  }
  cube.bucketCache.set(grain, keys)
  return keys
}

export function timeSeries(cube, mask, measure, grain) {
  if (!hasDates(cube)) return []
  const keys = bucketKeys(cube, grain)
  const res = groupAgg(
    cube,
    mask,
    measure,
    (i) => (keys[i] === keys[i] ? keys[i] : undefined),
    (i) => keys[i],
  )
  return [...res.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([key, acc]) => ({ key, label: bucketLabel(key, grain), value: finish(acc, measure), count: acc.count }))
}

// One series per top-N value of `dim` (+ "Other"), sharing one x axis.
export function timeSeriesBy(cube, mask, measure, dim, grain, topN = 5) {
  const total = groupBy(cube, mask, dim, measure)
  const ranked = (measure.agg === 'avg' ? [...total].sort((a, b) => b.count - a.count) : total).slice(0, topN)
  const base = timeSeries(cube, mask, measure, grain)
  const keys = base.map((p) => p.key)
  const series = []
  const chosen = new Set(ranked.map((r) => r.code))
  for (const r of ranked) {
    const sub = new Uint8Array(cube.n)
    for (let i = 0; i < cube.n; i++) sub[i] = mask[i] && dim.codes[i] === r.code ? 1 : 0
    const ts = new Map(timeSeries(cube, sub, measure, grain).map((p) => [p.key, p.value]))
    series.push({ name: r.name, values: keys.map((k) => ts.get(k) ?? 0) })
  }
  if (total.length > ranked.length && measure.agg !== 'avg') {
    const sub = new Uint8Array(cube.n)
    for (let i = 0; i < cube.n; i++) sub[i] = mask[i] && dim.codes[i] >= 0 && !chosen.has(dim.codes[i]) ? 1 : 0
    const ts = new Map(timeSeries(cube, sub, measure, grain).map((p) => [p.key, p.value]))
    series.push({ name: 'Other', values: keys.map((k) => ts.get(k) ?? 0), other: true })
  }
  return { keys, labels: base.map((p) => p.label), series }
}

// -------------------------------------------------------------------------
// Period comparison
// -------------------------------------------------------------------------

export function priorWindow(cube, filters) {
  const r = effectiveRange(cube, filters)
  if (!r) return null
  const len = r[1] - r[0] + 1
  const prior = [r[0] - len, r[0] - 1]
  const overlap = Math.max(0, Math.min(prior[1], cube.dateMax) - Math.max(prior[0], cube.dateMin) + 1)
  return { range: prior, coverage: overlap / len }
}

export function compare(cube, filters, measure) {
  const mask = makeMask(cube, filters)
  const current = aggregate(cube, mask, measure)
  const prior = priorWindow(cube, filters)
  if (!prior || prior.coverage < 0.9) return { current, prior: null, delta: null }
  const pv = aggregate(cube, makeMask(cube, filters, { range: prior.range }), measure)
  const delta = pv !== 0 ? ((current - pv) / Math.abs(pv)) * 100 : null
  return { current, prior: pv, delta }
}

// -------------------------------------------------------------------------
// Cross-tab (heatmap / matrix)
// -------------------------------------------------------------------------

export function crossTabMonthly(cube, mask, rowDim, measure, { maxRows = 8, maxCols = 12 } = {}) {
  if (!hasDates(cube)) return null
  const grain = allowedGrains(cube).includes('month') ? 'month' : autoGrain(cube, null)
  const keys = bucketKeys(cube, grain)
  const rows = groupBy(cube, mask, rowDim, measure).slice(0, maxRows)
  if (!rows.length) return null
  const rowIdx = new Map(rows.map((r, i) => [r.code, i]))
  const allKeys = [...new Set(timeSeries(cube, mask, measure, grain).map((p) => p.key))].sort((a, b) => a - b)
  const colKeys = allKeys.slice(-maxCols)
  const colIdx = new Map(colKeys.map((k, i) => [k, i]))
  const res = groupAgg(
    cube,
    mask,
    measure,
    (i) => {
      const r = rowIdx.get(rowDim.codes[i])
      const c = colIdx.get(keys[i])
      return r === undefined || c === undefined ? undefined : r * colKeys.length + c
    },
    (i) => keys[i],
  )
  const cells = new Float64Array(rows.length * colKeys.length).fill(NaN)
  let max = 0
  let min = Infinity
  for (const [k, acc] of res) {
    const v = finish(acc, measure)
    cells[k] = v
    if (v > max) max = v
    if (v < min) min = v
  }
  return { rows: rows.map((r) => r.name), cols: colKeys.map((k) => bucketLabel(k, grain)), width: colKeys.length, cells, max, min: Number.isFinite(min) ? min : 0 }
}

// Matrix: every measure by the members of one dimension.
export function matrix(cube, mask, dim, measures) {
  const byMeasure = measures.map((m) => new Map(groupBy(cube, mask, dim, m).map((g) => [g.code, g])))
  const codes = new Set()
  byMeasure.forEach((m) => m.forEach((_, code) => codes.add(code)))
  return [...codes].map((code) => ({
    code,
    name: dim.dict[code],
    values: byMeasure.map((m) => m.get(code)?.value ?? 0),
  }))
}

// -------------------------------------------------------------------------
// Table helpers
// -------------------------------------------------------------------------

export function columnAccessor(cube, col) {
  if (col.kind === 'date') return (i) => (cube.dates[i] === cube.dates[i] ? cube.dates[i] : null)
  if (col.kind === 'measure') {
    const m = cube.measures.find((x) => x.name === col.name)
    return (i) => (m.values[i] === m.values[i] ? m.values[i] : null)
  }
  if (col.kind === 'dimension') {
    const d = cube.dimensions.find((x) => x.name === col.name)
    return (i) => (d.codes[i] < 0 ? null : d.dict[d.codes[i]])
  }
  const e = cube.extras.find((x) => x.name === col.name)
  return (i) => e?.values[i] ?? null
}

export function maskedIndexes(mask) {
  const out = []
  for (let i = 0; i < mask.length; i++) if (mask[i]) out.push(i)
  return out
}

export function toCsv(cube, indexes) {
  const cols = cube.columns.map((c) => ({ col: c, get: columnAccessor(cube, c) }))
  const esc = (v) => {
    if (v == null) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [cols.map((c) => esc(c.col.name)).join(',')]
  for (const i of indexes) {
    lines.push(cols.map(({ col, get }) => esc(col.kind === 'date' ? fmtIso(get(i)) : get(i))).join(','))
  }
  return lines.join('\n')
}
