// "What the data is telling you" - generated live from the current filter
// state, so the insight rail changes as the user slices the dashboard.

import {
  aggregate,
  autoGrain,
  compare,
  effectiveRange,
  groupBy,
  hasDates,
  lowerIsBetter,
  makeMask,
  priorWindow,
  rankedDimensions,
  timeSeries,
} from './cube.js'
import { fmtDelta, fmtPct, fmtValue } from './fmt.js'

const tone = (change, measure) => {
  if (change == null || change === 0) return 'info'
  const good = lowerIsBetter(measure) ? change < 0 : change > 0
  return good ? 'positive' : 'negative'
}

export function buildInsights(cube, filters, measure, maxItems = 7) {
  const headline = []
  const dimGroups = []
  const timeGroup = []
  const mask = makeMask(cube, filters)
  const unit = measure.unit
  const label = measure.name
  const cmp = compare(cube, filters, measure)

  if (cmp.delta != null && Math.abs(cmp.delta) < 0.05) {
    headline.push({ type: 'info', text: `${label} is ${fmtValue(cmp.current, unit)} — flat against the previous period (${fmtValue(cmp.prior, unit)}).` })
  } else if (cmp.delta != null) {
    headline.push({
      type: tone(cmp.delta, measure),
      text: `${label} is ${fmtValue(cmp.current, unit)} — ${cmp.delta >= 0 ? 'up' : 'down'} ${fmtDelta(Math.abs(cmp.delta)).replace('+', '')} against the previous period (${fmtValue(cmp.prior, unit)}).`,
    })
  } else {
    headline.push({ type: 'info', text: `${label} totals ${fmtValue(cmp.current, unit)} for the current selection.` })
  }

  const prior = priorWindow(cube, filters)
  const priorMask = prior && prior.coverage >= 0.9 ? makeMask(cube, filters, { range: prior.range }) : null
  const additive = measure.agg !== 'avg'

  for (const dim of rankedDimensions(cube).slice(0, 3)) {
    const out = []
    dimGroups.push(out)
    const cur = groupBy(cube, mask, dim, measure)
    if (cur.length < 2) continue
    const total = cur.reduce((s, g) => s + Math.max(g.value, 0), 0)

    if (additive && total > 0) {
      const top = cur[0]
      const share = (top.value / total) * 100
      out.push({
        type: 'info',
        text: `${top.name} leads ${dim.name} with ${fmtPct(share, 0)} of ${label}${cur.length > 3 ? `; the top three account for ${fmtPct((cur.slice(0, 3).reduce((s, g) => s + g.value, 0) / total) * 100, 0)}` : ''}.`,
      })
    } else if (!additive) {
      const best = lowerIsBetter(measure) ? cur[cur.length - 1] : cur[0]
      const worst = lowerIsBetter(measure) ? cur[0] : cur[cur.length - 1]
      out.push({ type: 'info', text: `${dim.name}: ${best.name} has the best ${label} (${fmtValue(best.value, unit)}), ${worst.name} the weakest (${fmtValue(worst.value, unit)}).` })
    }

    if (priorMask) {
      const before = new Map(groupBy(cube, priorMask, dim, measure).map((g) => [g.code, g.value]))
      const moves = cur
        .map((g) => ({ ...g, before: before.get(g.code) }))
        .filter((g) => g.before && Math.abs(g.before) > 0)
        .map((g) => ({ ...g, change: ((g.value - g.before) / Math.abs(g.before)) * 100, abs: g.value - g.before }))
      if (moves.length >= 2) {
        const sorted = [...moves].sort((a, b) => b.change - a.change)
        const up = sorted[0]
        const down = sorted[sorted.length - 1]
        if (up.change > 5) out.push({ type: tone(up.change, measure), text: `${up.name} (${dim.name}) grew ${fmtDelta(up.change).replace('+', '')} — the strongest mover.` })
        if (down.change < -5) out.push({ type: tone(down.change, measure), text: `${down.name} (${dim.name}) fell ${fmtDelta(Math.abs(down.change)).replace('+', '')} versus the previous period.` })
      }
    }
  }

  if (hasDates(cube)) {
    const grain = autoGrain(cube, effectiveRange(cube, filters))
    const series = timeSeries(cube, mask, measure, grain)
    if (series.length >= 4) {
      const vals = series.map((p) => p.value)
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length
      const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length)
      const peak = series.reduce((a, b) => (b.value > a.value ? b : a))
      const low = series.reduce((a, b) => (b.value < a.value ? b : a))
      timeGroup.push({ type: 'info', text: `Peak ${grain}: ${peak.label} at ${fmtValue(peak.value, unit)}; lowest: ${low.label} at ${fmtValue(low.value, unit)}.` })
      if (sd > 0) {
        const odd = series.filter((p) => Math.abs(p.value - mean) / sd > 2.2)
        if (odd.length) {
          const p = odd.reduce((a, b) => (Math.abs(b.value - mean) > Math.abs(a.value - mean) ? b : a))
          timeGroup.push({ type: 'warning', text: `${p.label} looks unusual for ${label}: ${fmtValue(p.value, unit)} against an average of ${fmtValue(mean, unit)}.` })
        }
      }
    }
  }

  // Headline first, then the lead item of each dimension, then the trend
  // callouts, then whatever room is left - so one chatty dimension can't
  // crowd the rest out.
  const ordered = [...headline, ...dimGroups.map((g) => g[0]).filter(Boolean), ...timeGroup, ...dimGroups.flatMap((g) => g.slice(1))]
  const seen = new Set()
  return ordered.filter((i) => (seen.has(i.text) ? false : seen.add(i.text))).slice(0, maxItems)
}

// Convenience for KPI cards: value + like-for-like delta.
export function kpiFor(cube, filters, measure) {
  const mask = makeMask(cube, filters)
  const cmp = compare(cube, filters, measure)
  return { measure, value: cmp.current ?? aggregate(cube, mask, measure), delta: cmp.delta }
}
