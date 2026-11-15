import { useDeferredValue, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react'
import {
  autoGrain,
  columnAccessor,
  compare,
  effectiveRange,
  hasDates,
  lowerIsBetter,
  makeMask,
  maskedIndexes,
  matrix,
  aggregate,
  realMeasures,
  timeSeries,
  timeSeriesBy,
  toCsv,
  rankedDimensions,
} from '../../lib/cube.js'
import { fmtDay, fmtInt, fmtPct, fmtValue } from '../../lib/fmt.js'
import AIChat from '../ai/AIChat.jsx'
import { Card, CardHeader, DeltaPill, Eyebrow, Select } from '../ui/primitives.jsx'
import { HealthRing } from './Overview.jsx'
import { MiniTrend, MultiTrendChart, seriesColor } from './charts.jsx'

// -------------------------------------------------------------------------
// Trends
// -------------------------------------------------------------------------

export function TrendsTab({ cube, filters, measure, setMeasure }) {
  const measures = realMeasures(cube)
  const dims = rankedDimensions(cube)
  const [dimName, setDimName] = useState(dims[0]?.name)
  const dim = cube.dimensions.find((d) => d.name === dimName) ?? dims[0]
  const grain = autoGrain(cube, effectiveRange(cube, filters))

  const multi = useMemo(() => (dim && hasDates(cube) ? timeSeriesBy(cube, makeMask(cube, filters), measure, dim, grain, 5) : null), [cube, filters, measure, dim, grain])
  const minis = useMemo(() => {
    const mask = makeMask(cube, filters)
    return measures.map((m) => ({ m, ...compare(cube, filters, m), series: timeSeries(cube, mask, m, grain) }))
  }, [cube, filters, grain]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasDates(cube)) {
    return (
      <Card className="p-10 text-center">
        <p className="text-[14px] text-ink-soft">Trends need a date column, and this dataset doesn’t have one. Try the Breakdown or Data tabs.</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {multi && multi.series.length > 0 && (
        <Card className="p-5">
          <CardHeader
            title={`${measure.name} by ${dim.name}`}
            sub={measure.agg === 'avg' ? 'One line per value (top 5 by volume)' : 'Stacked: top 5 values + the rest'}
            right={
              <>
                <Select label="Measure" value={measure.name} onChange={setMeasure} options={measures.map((m) => ({ value: m.name, label: m.name }))} />
                {dims.length > 1 && <Select label="Split by" value={dim.name} onChange={setDimName} options={dims.map((d) => ({ value: d.name, label: d.name }))} />}
              </>
            }
          />
          <div className="mt-4">
            <MultiTrendChart labels={multi.labels} series={multi.series} unit={measure.unit} stacked={measure.agg !== 'avg'} />
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {multi.series.map((s, i) => (
              <li key={s.name} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.other ? 'var(--line-strong)' : seriesColor(i) }} />
                {s.name}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
        <Eyebrow className="mb-3">Every measure at a glance</Eyebrow>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {minis.map(({ m, current, delta, series }) => (
            <button
              key={m.name}
              type="button"
              onClick={() => setMeasure(m.name)}
              aria-pressed={m === measure}
              className={`rounded-2xl border bg-card p-4 text-left transition-colors hover:border-line-strong ${m === measure ? 'border-accent ring-1 ring-accent' : 'border-line'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] text-ink-faint">{m.name}</p>
                  <p className="mt-0.5 text-[20px] font-semibold text-ink tabular">{fmtValue(current, m.unit)}</p>
                </div>
                <DeltaPill delta={delta} lowerBetter={lowerIsBetter(m)} />
              </div>
              <MiniTrend data={series} color={m === measure ? 'var(--accent)' : 'var(--ink-faint)'} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Breakdown matrix
// -------------------------------------------------------------------------

export function BreakdownTab({ cube, filters, measure, setMeasure }) {
  const measures = realMeasures(cube)
  const dims = rankedDimensions(cube)
  const [dimName, setDimName] = useState(dims[0]?.name)
  const [sort, setSort] = useState({ col: measures.findIndex((m) => m === measure), dir: -1 })
  const [q, setQ] = useState('')
  const dim = cube.dimensions.find((d) => d.name === dimName) ?? dims[0]

  const { rows, totals } = useMemo(() => {
    if (!dim) return { rows: [], totals: [] }
    const mask = makeMask(cube, filters)
    return { rows: matrix(cube, mask, dim, measures), totals: measures.map((m) => aggregate(cube, mask, m)) }
  }, [cube, filters, dim]) // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => {
    const f = q ? rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())) : rows
    return [...f].sort((a, b) => (sort.col < 0 ? a.name.localeCompare(b.name) * -sort.dir : (a.values[sort.col] - b.values[sort.col]) * sort.dir))
  }, [rows, sort, q])

  if (!dim) return <Card className="p-10 text-center text-[14px] text-ink-soft">No categorical columns were detected in this dataset.</Card>
  const maxes = measures.map((_, i) => Math.max(...shown.map((r) => Math.abs(r.values[i])), 1))

  function toggleSort(col) {
    setSort((s) => (s.col === col ? { col, dir: -s.dir } : { col, dir: -1 }))
  }
  const arrow = (col) => (sort.col === col ? sort.dir === -1 ? <ArrowDown size={12} aria-hidden="true" /> : <ArrowUp size={12} aria-hidden="true" /> : null)

  return (
    <Card className="p-5">
      <CardHeader
        title={`Every measure by ${dim.name}`}
        sub={`${fmtInt(shown.length)} of ${fmtInt(rows.length)} values · click a column to sort`}
        right={
          <>
            <label className="flex items-center gap-1.5 rounded-full border border-line bg-card-alt px-2.5 py-1">
              <Search size={12} className="text-ink-faint" aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search values" className="w-24 bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-faint" />
            </label>
            <Select label="Rows" value={dim.name} onChange={setDimName} options={dims.map((d) => ({ value: d.name, label: d.name }))} />
          </>
        }
      />
      <div className="scroll-thin mt-4 max-h-[640px] overflow-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
          <thead className="sticky top-0 z-10 bg-card-alt">
            <tr>
              <th className="px-3 py-2 text-left">
                <button type="button" onClick={() => toggleSort(-1)} className="inline-flex items-center gap-1 font-semibold text-ink-soft hover:text-ink">
                  {dim.name} {arrow(-1)}
                </button>
              </th>
              {measures.map((m, i) => (
                <th key={m.name} className="px-3 py-2 text-right">
                  <button type="button" onClick={() => { toggleSort(i); setMeasure(m.name) }} className={`inline-flex items-center gap-1 font-semibold hover:text-ink ${m === measure ? 'text-accent-dark' : 'text-ink-soft'}`}>
                    {m.name} {arrow(i)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.code} className="border-t border-line hover:bg-card-alt/60">
                <td className="max-w-[220px] truncate px-3 py-2 text-ink" title={r.name}>
                  {r.name}
                </td>
                {r.values.map((v, i) => (
                  <td key={measures[i].name} className="relative px-3 py-2 text-right tabular text-ink">
                    {measures[i] === measure && <span className="absolute inset-y-1.5 right-0 rounded-l bg-accent/15" style={{ width: `${(Math.abs(v) / maxes[i]) * 88}%` }} aria-hidden="true" />}
                    <span className="relative">{fmtValue(v, measures[i].unit)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-card-alt">
            <tr className="border-t border-line-strong font-semibold">
              <td className="px-3 py-2 text-ink">Total</td>
              {totals.map((v, i) => (
                <td key={measures[i].name} className="px-3 py-2 text-right tabular text-ink">
                  {fmtValue(v, measures[i].unit)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}

// -------------------------------------------------------------------------
// Data table
// -------------------------------------------------------------------------

const PAGE = 50
const NUM = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

export function DataTab({ cube, filters, label }) {
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q)
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState(null) // { i, dir }

  const cols = useMemo(() => cube.columns.map((c) => ({ ...c, get: columnAccessor(cube, c) })), [cube])

  const indexes = useMemo(() => {
    const base = maskedIndexes(makeMask(cube, filters))
    if (!dq) return base
    const needle = dq.toLowerCase()
    const textCols = cols.filter((c) => c.kind === 'dimension' || c.kind === 'id' || c.kind === 'text')
    return base.filter((i) => textCols.some((c) => String(c.get(i) ?? '').toLowerCase().includes(needle)))
  }, [cube, filters, dq, cols])

  const sorted = useMemo(() => {
    if (!sort) return indexes
    const get = cols[sort.i].get
    const num = cols[sort.i].kind === 'measure' || cols[sort.i].kind === 'date'
    return [...indexes].sort((a, b) => {
      const x = get(a)
      const y = get(b)
      if (x == null) return 1
      if (y == null) return -1
      return (num ? x - y : String(x).localeCompare(String(y))) * sort.dir
    })
  }, [indexes, sort, cols])

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE))
  const cur = Math.min(page, pages - 1)
  const slice = sorted.slice(cur * PAGE, cur * PAGE + PAGE)

  function download() {
    const blob = new Blob([toCsv(cube, sorted)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${label.replace(/\.[^.]+$/, '')}-filtered.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const cell = (c, i) => {
    const v = c.get(i)
    if (v == null) return <span className="text-ink-faint">—</span>
    if (c.kind === 'date') return fmtDay(v)
    if (c.kind === 'measure') return c.unit === 'pct' ? `${NUM.format(v)}%` : c.unit === 'frac' ? `${NUM.format(v * 100)}%` : NUM.format(v)
    return String(v)
  }

  return (
    <Card className="p-5">
      <CardHeader
        title="Underlying rows"
        sub={`${fmtInt(sorted.length)} rows match the current filters`}
        right={
          <>
            <label className="flex items-center gap-1.5 rounded-full border border-line bg-card-alt px-2.5 py-1">
              <Search size={12} className="text-ink-faint" aria-hidden="true" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Search text columns" aria-label="Search rows" className="w-40 bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-faint" />
            </label>
            <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-card px-3 py-1 text-[12px] font-medium text-ink hover:border-ink/40">
              <Download size={13} aria-hidden="true" /> CSV
            </button>
          </>
        }
      />
      <div className="scroll-thin mt-4 max-h-[620px] overflow-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-[12.5px]">
          <thead className="sticky top-0 z-10 bg-card-alt">
            <tr>
              {cols.map((c, i) => (
                <th key={c.name} className={`whitespace-nowrap px-3 py-2 ${c.kind === 'measure' ? 'text-right' : 'text-left'}`}>
                  <button type="button" onClick={() => { setSort((s) => (s?.i === i ? { i, dir: -s.dir } : { i, dir: 1 })); setPage(0) }} className="inline-flex items-center gap-1 font-semibold text-ink-soft hover:text-ink">
                    {c.name}
                    {sort?.i === i && (sort.dir === 1 ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((i) => (
              <tr key={i} className="border-t border-line hover:bg-card-alt/60">
                {cols.map((c) => (
                  <td key={c.name} className={`max-w-[240px] truncate whitespace-nowrap px-3 py-1.5 text-ink ${c.kind === 'measure' ? 'text-right tabular' : ''}`}>
                    {cell(c, i)}
                  </td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="px-3 py-10 text-center text-ink-faint">
                  No rows match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-ink-faint">
        <span className="tabular">
          {fmtInt(Math.min(sorted.length, cur * PAGE + 1))}–{fmtInt(Math.min(sorted.length, cur * PAGE + PAGE))} of {fmtInt(sorted.length)}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="Previous page" className="rounded-full border border-line p-1.5 hover:border-line-strong disabled:opacity-30">
            <ChevronLeft size={14} />
          </button>
          <span className="px-2 tabular">
            {cur + 1} / {fmtInt(pages)}
          </span>
          <button type="button" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="Next page" className="rounded-full border border-line p-1.5 hover:border-line-strong disabled:opacity-30">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </Card>
  )
}

// -------------------------------------------------------------------------
// Data quality
// -------------------------------------------------------------------------

const KIND_LABEL = { date: 'Date', measure: 'Measure', dimension: 'Dimension', id: 'Identifier', text: 'Text' }

function ColumnCard({ p, unit }) {
  const fmt = (v) => fmtValue(v, unit ?? 'number')
  const maxHist = Math.max(...(p.hist ?? [1]), 1)
  const maxTop = Math.max(...(p.top ?? []).map((t) => t.count), 1)
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[13.5px] font-semibold text-ink" title={p.name}>
          {p.name}
        </p>
        <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10.5px] font-medium text-ink-faint">{KIND_LABEL[p.kind] ?? p.kind}</span>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11.5px] text-ink-faint">
          <span>Complete</span>
          <span className="tabular">{fmtPct(100 - p.missing_pct)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-card-alt">
          <div className="h-full rounded-full" style={{ width: `${100 - p.missing_pct}%`, background: p.missing_pct > 10 ? 'var(--warning)' : 'var(--positive)' }} />
        </div>
      </div>
      <p className="mt-2 text-[11.5px] text-ink-faint">
        <span className="tabular">{fmtInt(p.distinct)}</span> distinct values
      </p>

      {p.kind === 'measure' && p.hist && (
        <>
          <div className="mt-3 flex h-12 items-end gap-[2px]" aria-hidden="true">
            {p.hist.map((h, i) => (
              <span key={i} className="flex-1 rounded-t-[2px] bg-accent/70" style={{ height: `${Math.max((h / maxHist) * 100, 3)}%` }} />
            ))}
          </div>
          <dl className="mt-2 grid grid-cols-4 gap-1 text-[11px]">
            {[['Min', p.min], ['Median', p.median], ['Mean', p.mean], ['Max', p.max]].map(([k, v]) => (
              <div key={k}>
                <dt className="text-ink-faint">{k}</dt>
                <dd className="truncate font-medium text-ink tabular" title={String(v)}>{fmt(v)}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {p.kind === 'date' && p.min && (
        <p className="mt-3 text-[12px] text-ink-soft">
          {p.min} → {p.max}
        </p>
      )}
      {p.top && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {p.top.map((t) => (
            <li key={t.value} className="grid grid-cols-[minmax(0,1fr)_60px_auto] items-center gap-2 text-[11.5px]">
              <span className="truncate text-ink-soft" title={t.value}>{t.value}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-card-alt">
                <span className="block h-full rounded-full bg-accent/70" style={{ width: `${(t.count / maxTop) * 100}%` }} />
              </span>
              <span className="text-ink-faint tabular">{fmtInt(t.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function QualityTab({ cube, analysis }) {
  const h = analysis.health
  const unitOf = (name) => cube.measures.find((m) => m.name === name)?.unit
  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-6">
          <HealthRing score={h.score} size={96} />
          <div className="min-w-[220px] flex-1">
            <h3 className="text-[16px] font-semibold tracking-tight text-ink">Data health: {h.score >= 85 ? 'strong' : h.score >= 65 ? 'fair' : 'needs attention'}</h3>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-soft">
              Scored from completeness, duplicate rows and unusual values across the whole file{h.date_span_label ? ` — ${h.date_span_label}` : ''}. Column detail is below.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-[13px] sm:grid-cols-4">
            {[['Rows', fmtInt(h.rows_analyzed)], ['Columns', fmtInt(h.columns_detected)], ['Missing', fmtPct(h.missing_pct)], ['Anomalies', fmtInt(h.anomaly_count)]].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11.5px] text-ink-faint">{k}</dt>
                <dd className="font-semibold text-ink tabular">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cube.profile.map((p) => (
          <ColumnCard key={p.name} p={p} unit={unitOf(p.name)} />
        ))}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Ask
// -------------------------------------------------------------------------

const plural = (w) => (/s$/.test(w) ? w : /y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`)

export function AskTab({ cube, source, measure }) {
  const dims = rankedDimensions(cube)
  const questions = [
    dims[0] && `Which ${dims[0].name.toLowerCase()} performs best?`,
    dims[1] && `What are my top ${plural(dims[1].name.toLowerCase())}?`,
    `Why did ${measure.name.toLowerCase()} change?`,
    'Show unusual trends',
    'What should I investigate?',
  ].filter(Boolean)
  return (
    <Card className="mx-auto max-w-3xl p-5 sm:p-7">
      <AIChat datasetSource={source} title="Ask your data anything" questions={questions} />
      <p className="mt-5 text-[11.5px] leading-relaxed text-ink-faint">
        Answers are computed from your data by SQL-style aggregation first; AI only phrases the explanation. The free demo allows a handful of questions per day.
      </p>
    </Card>
  )
}

