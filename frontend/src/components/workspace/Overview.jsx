import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import AnimatedValue from '../../motion/AnimatedValue.jsx'
import { EASE_OUT } from '../../motion/tokens.js'
import { AlertTriangle, CheckCircle2, Info, TrendingDown, TrendingUp } from 'lucide-react'
import {
  allowedGrains,
  autoGrain,
  compare,
  crossTabMonthly,
  effectiveRange,
  groupBy,
  hasDates,
  lowerIsBetter,
  makeMask,
  priorWindow,
  rankedDimensions,
  realMeasures,
  timeSeries,
} from '../../lib/cube.js'
import { buildInsights } from '../../lib/insights.js'
import { fmtDay, fmtInt, fmtValue, fmtPct } from '../../lib/fmt.js'
import { Card, CardHeader, DeltaPill, Eyebrow, Segmented, Select, Sparkline } from '../ui/primitives.jsx'
import { DonutChart, Heatmap, RankedBars, TrendChart } from './charts.jsx'

const ROLE_ORDER = ['revenue', 'profit', 'cost', 'quantity']

function orderedMeasures(cube, primary) {
  const real = realMeasures(cube)
  const rest = real.filter((m) => m !== primary).sort((a, b) => {
    const ra = ROLE_ORDER.indexOf(a.role)
    const rb = ROLE_ORDER.indexOf(b.role)
    return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb)
  })
  return [primary, ...rest].filter(Boolean)
}

// -------------------------------------------------------------------------
// KPI strip
// -------------------------------------------------------------------------

function useKpiCards(cube, filters, primary) {
  return useMemo(() => {
    const mask = makeMask(cube, filters)
    const grain = hasDates(cube) ? (allowedGrains(cube).includes('month') ? 'month' : autoGrain(cube, null)) : null
    const spark = (m) => (grain ? timeSeries(cube, mask, m, grain).map((p) => p.value) : [])
    const list = orderedMeasures(cube, primary)
    const cards = []
    for (const m of list) {
      const c = compare(cube, filters, m)
      cards.push({ key: m.name, measure: m, value: c.current, prior: c.prior, delta: c.delta, spark: spark(m), unit: m.unit })
      const rev = list.find((x) => x.role === 'revenue')
      const prof = list.find((x) => x.role === 'profit')
      if (m === prof && rev && prof) {
        const cr = compare(cube, filters, rev)
        const cp = compare(cube, filters, prof)
        const ratio = (p, r) => (r ? (p / r) * 100 : 0)
        const rs = spark(rev)
        const ps = spark(prof)
        cards.push({
          key: '__margin',
          derived: true,
          label: 'Margin',
          value: ratio(cp.current, cr.current),
          prior: cp.prior != null && cr.prior ? ratio(cp.prior, cr.prior) : null,
          delta: cp.prior != null && cr.prior ? ratio(cp.current, cr.current) - ratio(cp.prior, cr.prior) : null,
          deltaIsPoints: true,
          spark: ps.map((v, i) => ratio(v, rs[i])),
          unit: 'pct',
        })
      }
    }
    return cards.slice(0, 8)
  }, [cube, filters, primary])
}

export function KpiStrip({ cube, filters, measure, primary, onSelect }) {
  const cards = useKpiCards(cube, filters, primary)
  // Pick a column count that fills whole rows (6 -> 3x2, 8 -> 4x2); a ragged
  // last row stretches its final card instead of leaving a hole.
  const n = cards.length
  const cols = n <= 4 ? Math.max(n, 1) : n === 5 || n === 6 || n === 9 ? 3 : 4
  const rem = n % cols
  return (
    <motion.div className="grid grid-cols-2 gap-3 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]" style={{ '--cols': cols }} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}>
      {cards.map((c, i) => {
        const active = !c.derived && c.measure === measure
        const name = c.derived ? c.label : c.measure.name
        return (
          <motion.button
            key={c.key}
            variants={{ hidden: { opacity: 0, y: 26, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: EASE_OUT } } }}
            type="button"
            disabled={c.derived}
            onClick={() => !c.derived && onSelect(c.measure.name)}
            aria-pressed={active}
            style={rem && i === n - 1 ? { gridColumn: `span ${cols - rem + 1}` } : undefined}
            className={`group relative flex flex-col rounded-2xl border bg-card p-4 text-left transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-card ${active ? 'border-accent ring-1 ring-accent' : 'border-line'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <Eyebrow className="truncate !text-[10.5px]">{name}</Eyebrow>
              {c.deltaIsPoints ? (
                c.delta != null && (
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular ${c.delta >= 0 ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
                    {c.delta >= 0 ? '+' : ''}
                    {c.delta.toFixed(1)} pts
                  </span>
                )
              ) : (
                <DeltaPill delta={c.delta} lowerBetter={!c.derived && lowerIsBetter(c.measure)} />
              )}
            </div>
            <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight text-ink tabular">
              <AnimatedValue value={c.value} unit={c.unit} />
            </p>
            <div className="mt-3 -mb-1">
              <Sparkline values={c.spark} color={active ? 'var(--accent)' : 'var(--ink-faint)'} />
            </div>
            <p className="mt-1.5 truncate text-[11.5px] text-ink-faint">{c.prior != null ? `vs ${fmtValue(c.prior, c.unit)} previous period` : c.measure?.agg === 'avg' ? 'Average' : c.measure?.agg === 'snapshot' ? 'Latest snapshot' : 'Total'}</p>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

// -------------------------------------------------------------------------
// Trend
// -------------------------------------------------------------------------

const TYPE_OPTS = [
  { value: 'area', label: 'Area' },
  { value: 'line', label: 'Line' },
  { value: 'bar', label: 'Bars' },
]
const GRAIN_LABEL = { day: 'Day', week: 'Week', month: 'Month', quarter: 'Qtr', year: 'Year' }

export function TrendCard({ cube, filters, measure, measures, onMeasure, userGrain, onGrain }) {
  const [type, setType] = useState('area')
  const [showPrior, setShowPrior] = useState(true)
  const range = effectiveRange(cube, filters)
  const grains = allowedGrains(cube)
  const grain = userGrain && grains.includes(userGrain) ? userGrain : autoGrain(cube, range)

  const { data, hasPrior } = useMemo(() => {
    const cur = timeSeries(cube, makeMask(cube, filters), measure, grain)
    const pw = priorWindow(cube, filters)
    const prior = pw && pw.coverage >= 0.9 ? timeSeries(cube, makeMask(cube, filters, { range: pw.range }), measure, grain) : []
    const rows = cur.map((p, i) => ({ label: p.label, value: p.value, prior: prior[i]?.value ?? null, priorLabel: prior[i]?.label ?? null }))
    return { data: rows, hasPrior: prior.length > 0 }
  }, [cube, filters, measure, grain])

  return (
    <Card delay={0.22} className="p-5">
      <CardHeader
        title={`${measure.name} over time`}
        sub={range ? `${fmtDay(range[0])} → ${fmtDay(range[1])} · by ${GRAIN_LABEL[grain]?.toLowerCase() ?? grain}` : 'No date column detected'}
        right={
          <>
            <Select label="Measure" value={measure.name} onChange={onMeasure} options={measures.map((m) => ({ value: m.name, label: m.name }))} />
            {grains.length > 1 && <Segmented label="Time grain" value={grain} onChange={onGrain} options={grains.map((g) => ({ value: g, label: GRAIN_LABEL[g] }))} />}
            <Segmented label="Chart type" value={type} onChange={setType} options={TYPE_OPTS} />
          </>
        }
      />
      {data.length >= 2 ? (
        <>
          <div className="mt-4">
            <TrendChart data={data} unit={measure.unit} name={measure.name} type={type} showPrior={showPrior && hasPrior} height={300} animateOnMount />
          </div>
          {hasPrior && (
            <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-[12px] text-ink-faint">
              <input type="checkbox" checked={showPrior} onChange={(e) => setShowPrior(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--accent)]" />
              Compare with the previous period
            </label>
          )}
        </>
      ) : (
        <p className="py-16 text-center text-[13px] text-ink-faint">{hasDates(cube) ? 'Not enough points in this selection to draw a trend.' : 'This dataset has no date column, so a trend cannot be drawn.'}</p>
      )}
    </Card>
  )
}

// -------------------------------------------------------------------------
// Breakdown (ranked bars / donut, doubles as a slicer)
// -------------------------------------------------------------------------

export function BreakdownCard({ cube, filters, measure, initialDim, onToggle, defaultView = 'bars', className = '', delay = 0.3 }) {
  const [dimName, setDimName] = useState(initialDim)
  const [view, setView] = useState(defaultView)
  const [all, setAll] = useState(false)
  const dim = cube.dimensions.find((d) => d.name === dimName) ?? cube.dimensions[0]

  const rows = useMemo(() => groupBy(cube, makeMask(cube, filters, { skipDim: dim.name }), dim, measure), [cube, filters, measure, dim])
  const selected = filters.dims[dim.name]
  const limit = all ? 60 : 7
  const sortedRows = measure.agg === 'avg' && lowerIsBetter(measure) ? [...rows].reverse() : rows

  return (
    <Card delay={delay} className={`p-5 ${className}`}>
      <CardHeader
        title={`${measure.name} by ${dim.name}`}
        sub={`${fmtInt(rows.length)} ${rows.length === 1 ? 'value' : 'values'}${selected?.size ? ` · ${selected.size} selected` : ' · click to filter'}`}
        right={
          <>
            {cube.dimensions.length > 1 && <Select label="Dimension" value={dim.name} onChange={setDimName} options={cube.dimensions.map((d) => ({ value: d.name, label: d.name }))} />}
            <Segmented label="View" value={view} onChange={setView} options={[{ value: 'bars', label: 'Bars' }, { value: 'donut', label: 'Share' }]} />
          </>
        }
      />
      <div className="mt-3">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-ink-faint">No data for this selection.</p>
        ) : view === 'donut' ? (
          <DonutChart rows={sortedRows} unit={measure.unit} selected={selected} onToggle={(code) => onToggle(dim.name, code)} />
        ) : (
          <>
            <RankedBars rows={sortedRows} unit={measure.unit} selected={selected} onToggle={(code) => onToggle(dim.name, code)} limit={limit} share={measure.agg !== 'avg'} />
            {rows.length > 7 && (
              <button type="button" onClick={() => setAll((v) => !v)} className="mt-2 px-2 text-[12px] font-medium text-accent-dark hover:underline">
                {all ? 'Show top 7' : `Show all ${fmtInt(Math.min(rows.length, 60))}`}
              </button>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

// -------------------------------------------------------------------------
// Heatmap
// -------------------------------------------------------------------------

export function HeatmapCard({ cube, filters, measure, initialDim }) {
  const [dimName, setDimName] = useState(initialDim)
  const dim = cube.dimensions.find((d) => d.name === dimName) ?? cube.dimensions[0]
  const grid = useMemo(() => crossTabMonthly(cube, makeMask(cube, filters), dim, measure), [cube, filters, dim, measure])
  return (
    <Card delay={0.62} className="p-5">
      <CardHeader
        title={`${dim.name} × month`}
        sub={`${measure.name} — darker means higher`}
        right={cube.dimensions.length > 1 && <Select label="Rows" value={dim.name} onChange={setDimName} options={cube.dimensions.map((d) => ({ value: d.name, label: d.name }))} />}
      />
      <div className="mt-4">{grid ? <Heatmap grid={grid} unit={measure.unit} /> : <p className="py-10 text-center text-[13px] text-ink-faint">A date column and at least one dimension are needed for this view.</p>}</div>
    </Card>
  )
}

// -------------------------------------------------------------------------
// Movers: who gained / lost against the previous period
// -------------------------------------------------------------------------

export function MoversCard({ cube, filters, measure, initialDim }) {
  const [dimName, setDimName] = useState(initialDim)
  const dim = cube.dimensions.find((d) => d.name === dimName) ?? cube.dimensions[0]

  const movers = useMemo(() => {
    const pw = priorWindow(cube, filters)
    if (!pw || pw.coverage < 0.9) return null
    const cur = groupBy(cube, makeMask(cube, filters), dim, measure)
    const before = new Map(groupBy(cube, makeMask(cube, filters, { range: pw.range }), dim, measure).map((g) => [g.code, g.value]))
    const rows = cur.map((g) => ({ ...g, before: before.get(g.code) ?? 0, diff: g.value - (before.get(g.code) ?? 0) })).filter((g) => g.before !== 0 || g.value !== 0)
    rows.sort((a, b) => b.diff - a.diff)
    return { up: rows.filter((r) => r.diff > 0).slice(0, 4), down: rows.filter((r) => r.diff < 0).slice(-4).reverse() }
  }, [cube, filters, dim, measure])

  const renderRow = (r) => {
    const pct = r.before ? (r.diff / Math.abs(r.before)) * 100 : null
    return (
      <li key={r.code} className="flex items-center gap-2 py-1.5">
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft" title={r.name}>
          {r.name}
        </span>
        <span className="whitespace-nowrap text-[12px] font-semibold text-ink tabular">
          {r.diff > 0 ? '+' : '−'}
          {fmtValue(Math.abs(r.diff), measure.unit)}
        </span>
        <DeltaPill delta={pct} lowerBetter={lowerIsBetter(measure)} />
      </li>
    )
  }

  return (
    <Card delay={0.5} className="p-5">
      <CardHeader
        title="Biggest movers"
        sub={`${measure.name} by ${dim.name}, vs previous period`}
        right={cube.dimensions.length > 1 && <Select label="Dimension" value={dim.name} onChange={setDimName} options={cube.dimensions.map((d) => ({ value: d.name, label: d.name }))} />}
      />
      {movers ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-positive">
              <TrendingUp size={13} aria-hidden="true" /> Gaining
            </p>
            <ul className="divide-y divide-line">{movers.up.length ? movers.up.map(renderRow) : <li className="py-2 text-[12px] text-ink-faint">Nothing grew.</li>}</ul>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-negative">
              <TrendingDown size={13} aria-hidden="true" /> Losing
            </p>
            <ul className="divide-y divide-line">{movers.down.length ? movers.down.map(renderRow) : <li className="py-2 text-[12px] text-ink-faint">Nothing fell.</li>}</ul>
          </div>
        </div>
      ) : (
        <p className="py-10 text-center text-[13px] text-ink-faint">Pick a shorter date range with an equally long period before it to compare.</p>
      )}
    </Card>
  )
}

// -------------------------------------------------------------------------
// Insights rail
// -------------------------------------------------------------------------

const ICONS = { positive: CheckCircle2, negative: TrendingDown, warning: AlertTriangle, info: Info }
const TONE = { positive: 'text-positive', negative: 'text-negative', warning: 'text-warning', info: 'text-accent-dark' }

export function InsightsRail({ cube, filters, measure, health }) {
  const insights = useMemo(() => buildInsights(cube, filters, measure), [cube, filters, measure])
  return (
    <div className="flex flex-col gap-4">
      <Card delay={0.3} className="p-5">
        <CardHeader title="What the data is saying" sub="Updates as you filter" />
        <ul className="mt-3 flex flex-col gap-3">
          {insights.map((i, idx) => {
            const Icon = ICONS[i.type] ?? Info
            return (
              <motion.li key={i.text} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE_OUT, delay: Math.min(0.45 + idx * 0.07, 1) }} className="flex gap-2.5 text-[13px] leading-snug text-ink-soft">
                <Icon size={15} className={`mt-0.5 shrink-0 ${TONE[i.type]}`} aria-hidden="true" />
                <span>{i.text}</span>
              </motion.li>
            )
          })}
        </ul>
      </Card>
      {health && (
        <Card delay={0.4} className="p-5">
          <CardHeader title="Data health" sub="From the full uploaded file" />
          <div className="mt-3 flex items-center gap-4">
            <HealthRing score={health.score} />
            <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
              <dt className="text-ink-faint">Rows</dt>
              <dd className="text-right font-medium text-ink tabular">{fmtInt(health.rows_analyzed)}</dd>
              <dt className="text-ink-faint">Missing</dt>
              <dd className="text-right font-medium text-ink tabular">{fmtPct(health.missing_pct)}</dd>
              <dt className="text-ink-faint">Duplicates</dt>
              <dd className="text-right font-medium text-ink tabular">{fmtPct(health.duplicate_pct)}</dd>
              <dt className="text-ink-faint">Anomalies</dt>
              <dd className="text-right font-medium text-ink tabular">{fmtInt(health.anomaly_count)}</dd>
            </dl>
          </div>
        </Card>
      )}
    </div>
  )
}

export function HealthRing({ score, size = 76 }) {
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  const color = score >= 85 ? 'var(--positive)' : score >= 65 ? 'var(--warning)' : 'var(--negative)'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[19px] font-semibold leading-none text-ink tabular">{score}</span>
        <span className="mt-0.5 text-[9px] uppercase tracking-wide text-ink-faint">/100</span>
      </span>
    </div>
  )
}

// -------------------------------------------------------------------------
// Composition of the Overview tab
// -------------------------------------------------------------------------

export default function Overview({ cube, analysis, filters, measure, primary, measures, setMeasure, userGrain, setUserGrain, toggleDim }) {
  const dims = rankedDimensions(cube)
  const d = (i) => dims[i]?.name ?? dims[0]?.name
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-5">
        <KpiStrip cube={cube} filters={filters} measure={measure} primary={primary} onSelect={setMeasure} />
        <TrendCard cube={cube} filters={filters} measure={measure} measures={measures} onMeasure={setMeasure} userGrain={userGrain} onGrain={setUserGrain} />
        {dims.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            <BreakdownCard cube={cube} filters={filters} measure={measure} initialDim={d(0)} onToggle={toggleDim} delay={0.34} />
            <BreakdownCard cube={cube} filters={filters} measure={measure} initialDim={d(1)} onToggle={toggleDim} defaultView="donut" delay={0.42} />
            {dims.length > 2 && <BreakdownCard cube={cube} filters={filters} measure={measure} initialDim={d(2)} onToggle={toggleDim} delay={0.5} />}
            {dims.length > 3 && <BreakdownCard cube={cube} filters={filters} measure={measure} initialDim={d(3)} onToggle={toggleDim} delay={0.58} />}
          </div>
        )}
        {dims.length > 0 && hasDates(cube) && <HeatmapCard cube={cube} filters={filters} measure={measure} initialDim={d(0)} />}
      </div>
      <aside className="flex min-w-0 flex-col gap-5 scroll-thin xl:sticky xl:top-[calc(3.5rem+var(--filter-h,3.4rem)+1rem)] xl:max-h-[calc(100svh-3.5rem-var(--filter-h,3.4rem)-2rem)] xl:self-start xl:overflow-y-auto">
        <InsightsRail cube={cube} filters={filters} measure={measure} health={analysis.health} />
        {dims.length > 0 && <MoversCard cube={cube} filters={filters} measure={measure} initialDim={d(0)} />}
      </aside>
    </div>
  )
}

