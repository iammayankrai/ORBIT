import { useId } from 'react'
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmtAxis, fmtPct, fmtValue } from '../../lib/fmt.js'

const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)', 'var(--s7)']
export const seriesColor = (i) => SERIES[i % SERIES.length]

const axisTick = { fill: 'var(--ink-faint)', fontSize: 11 }

function TipShell({ title, children }) {
  return (
    <div className="min-w-[150px] rounded-xl border border-line-strong bg-card px-3 py-2.5 text-[12.5px] shadow-card-lg">
      {title && <p className="mb-1.5 font-semibold text-ink">{title}</p>}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

const Row = ({ color, label, value }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="flex items-center gap-1.5 text-ink-soft">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
    <span className="font-semibold text-ink tabular">{value}</span>
  </div>
)

function TrendTooltip({ active, payload, unit, name }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <TipShell title={p.label}>
      <Row color="var(--accent)" label={name} value={fmtValue(p.value, unit)} />
      {p.prior != null && <Row color="var(--ink-faint)" label={p.priorLabel ? `Prior (${p.priorLabel})` : 'Prior period'} value={fmtValue(p.prior, unit)} />}
    </TipShell>
  )
}

// type: 'area' | 'line' | 'bar'. `prior` values (if present on the data rows)
// are drawn as a dashed comparison line.
export function TrendChart({ data, unit, name, type = 'area', height = 300, showPrior = false, color = 'var(--accent)' }) {
  const gid = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" vertical={false} strokeDasharray="3 5" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={28} interval="preserveStartEnd" />
        <YAxis tickLine={false} axisLine={false} width={50} tick={axisTick} tickFormatter={(v) => fmtAxis(v, unit)} />
        <Tooltip content={<TrendTooltip unit={unit} name={name} />} cursor={{ stroke: 'var(--line-strong)', strokeDasharray: '3 3' }} isAnimationActive={false} />
        {type === 'bar' && <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={38} isAnimationActive={false} />}
        {type === 'line' && <Line dataKey="value" stroke={color} strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />}
        {type === 'area' && <Area dataKey="value" stroke={color} strokeWidth={2.4} fill={`url(#${gid})`} isAnimationActive={false} activeDot={{ r: 4 }} />}
        {showPrior && <Line dataKey="prior" stroke="var(--ink-faint)" strokeWidth={1.6} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// Multi-series trend: stacked areas for additive measures, lines for averages.
export function MultiTrendChart({ labels, series, unit, stacked, height = 320 }) {
  const data = labels.map((label, i) => {
    const row = { label }
    series.forEach((s, j) => {
      row[`s${j}`] = s.values[i]
    })
    return row
  })
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--line)" vertical={false} strokeDasharray="3 5" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={28} interval="preserveStartEnd" />
        <YAxis tickLine={false} axisLine={false} width={50} tick={axisTick} tickFormatter={(v) => fmtAxis(v, unit)} />
        <Tooltip
          isAnimationActive={false}
          cursor={{ stroke: 'var(--line-strong)', strokeDasharray: '3 3' }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TipShell title={label}>
                {[...payload]
                  .sort((a, b) => b.value - a.value)
                  .map((p) => (
                    <Row key={p.dataKey} color={p.stroke || p.fill} label={series[Number(p.dataKey.slice(1))].name} value={fmtValue(p.value, unit)} />
                  ))}
              </TipShell>
            ) : null
          }
        />
        {series.map((s, j) =>
          stacked ? (
            <Area key={s.name} dataKey={`s${j}`} stackId="1" stroke={s.other ? 'var(--line-strong)' : seriesColor(j)} fill={s.other ? 'var(--line)' : seriesColor(j)} fillOpacity={s.other ? 0.5 : 0.78} strokeWidth={1} isAnimationActive={false} />
          ) : (
            <Line key={s.name} dataKey={`s${j}`} stroke={seriesColor(j)} strokeWidth={2} dot={false} isAnimationActive={false} />
          ),
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function MiniTrend({ data, color = 'var(--accent)', height = 70 }) {
  const gid = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" hide />
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Area dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive={false} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// Ranked list with in-row bars. Clicking a row toggles it as a filter, so the
// chart doubles as a slicer (selected rows stay bright, the rest dim).
export function RankedBars({ rows, unit, selected, onToggle, limit = 8, color = 'var(--accent)', share = true }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1)
  const total = rows.reduce((s, r) => s + Math.max(r.value, 0), 0)
  const anySel = selected && selected.size > 0
  return (
    <ul className="flex flex-col gap-1">
      {rows.slice(0, limit).map((r) => {
        const on = !anySel || selected.has(r.code)
        const pct = (Math.abs(r.value) / max) * 100
        return (
          <li key={r.code}>
            <button
              type="button"
              onClick={() => onToggle?.(r.code)}
              aria-pressed={selected?.has(r.code) ?? false}
              className={`group grid w-full grid-cols-[minmax(70px,34%)_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-card-alt ${on ? '' : 'opacity-40'}`}
            >
              <span className="truncate text-[12.5px] text-ink-soft group-hover:text-ink" title={r.name}>
                {r.name}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-card-alt">
                <span className="block h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.max(pct, 1.5)}%`, background: r.value < 0 ? 'var(--negative)' : color }} />
              </span>
              <span className="flex items-baseline gap-2 text-right">
                <span className="text-[12.5px] font-semibold text-ink tabular">{fmtValue(r.value, unit)}</span>
                {share && total > 0 && <span className="w-9 text-[11px] text-ink-faint tabular">{fmtPct((Math.max(r.value, 0) / total) * 100, 0)}</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function DonutChart({ rows, unit, selected, onToggle, height = 210 }) {
  const top = rows.slice(0, 6)
  const rest = rows.slice(6)
  const data = [...top.map((r, i) => ({ ...r, color: seriesColor(i) })), ...(rest.length ? [{ code: -1, name: `${rest.length} others`, value: rest.reduce((s, r) => s + Math.max(r.value, 0), 0), color: 'var(--line-strong)' }] : [])].filter((d) => d.value > 0)
  const total = data.reduce((s, d) => s + d.value, 0)
  const anySel = selected && selected.size > 0
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="94%" paddingAngle={2} stroke="var(--card)" strokeWidth={2} isAnimationActive={false} onClick={(d) => d.code >= 0 && onToggle?.(d.code)}>
              {data.map((d) => (
                <Cell key={d.code} fill={d.color} opacity={!anySel || selected.has(d.code) ? 1 : 0.3} style={{ cursor: d.code >= 0 ? 'pointer' : 'default', outline: 'none' }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="eyebrow !text-[10px]">Total</span>
          <span className="text-[15px] font-semibold text-ink tabular">{fmtValue(total, unit)}</span>
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-1 flex-col gap-1">
        {data.map((d) => (
          <li key={d.code}>
            <button
              type="button"
              disabled={d.code < 0}
              onClick={() => onToggle?.(d.code)}
              className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] hover:bg-card-alt ${!anySel || selected.has(d.code) ? '' : 'opacity-40'}`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
              <span className="min-w-0 flex-1 truncate text-ink-soft">{d.name}</span>
              <span className="text-ink-faint tabular">{fmtPct((d.value / total) * 100, 0)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Heatmap({ grid, unit }) {
  const { rows, cols, width, cells, max, min } = grid
  const span = max - min || 1
  return (
    <div className="overflow-x-auto scroll-thin">
      <div className="grid min-w-[520px] gap-[3px]" style={{ gridTemplateColumns: `minmax(92px,16%) repeat(${width}, minmax(0,1fr))` }}>
        <div />
        {cols.map((c) => (
          <div key={c} className="truncate pb-1 text-center text-[10.5px] text-ink-faint">
            {c}
          </div>
        ))}
        {rows.map((r, ri) => (
          <HeatRow key={r} name={r} cells={cells} ri={ri} width={width} cols={cols} min={min} span={span} unit={unit} />
        ))}
      </div>
    </div>
  )
}

function HeatRow({ name, cells, ri, width, cols, min, span, unit }) {
  return (
    <>
      <div className="truncate pr-2 text-[12px] leading-[28px] text-ink-soft" title={name}>
        {name}
      </div>
      {Array.from({ length: width }, (_, ci) => {
        const v = cells[ri * width + ci]
        const has = v === v
        const t = has ? (v - min) / span : 0
        return (
          <div
            key={ci}
            title={has ? `${name} · ${cols[ci]}: ${fmtValue(v, unit)}` : `${name} · ${cols[ci]}: no data`}
            className="h-7 rounded-[5px]"
            style={{ background: has ? `color-mix(in srgb, var(--accent) ${Math.round(8 + t * 88)}%, var(--card-alt))` : 'var(--card-alt)', opacity: has ? 1 : 0.5 }}
          />
        )
      })}
    </>
  )
}
