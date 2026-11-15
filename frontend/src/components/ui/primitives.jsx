import { ChevronDown } from 'lucide-react'

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-2xl border border-line bg-card ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, sub, right, className = '' }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-x-3 gap-y-2.5 ${className}`}>
      <div className="min-w-0 flex-1 basis-[200px]">
        <h3 className="truncate text-[14.5px] font-semibold tracking-tight text-ink">{title}</h3>
        {sub && <p className="mt-0.5 truncate text-[12px] text-ink-faint">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  )
}

export function Eyebrow({ children, className = '' }) {
  return <p className={`eyebrow ${className}`}>{children}</p>
}

// Compact pill toggle: [ Day | Week | Month ].
export function Segmented({ options, value, onChange, size = 'sm', label }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]'
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-0.5 rounded-full border border-line bg-card-alt p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`rounded-full font-medium transition-colors ${pad} ${active ? 'bg-ink text-paper shadow-sm' : 'text-ink-faint hover:text-ink'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Select({ value, onChange, options, label, className = '' }) {
  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[210px] cursor-pointer appearance-none truncate rounded-full border border-line bg-card-alt py-1 pl-3 pr-7 text-[12px] font-medium text-ink hover:border-line-strong"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-card text-ink">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 text-ink-faint" aria-hidden="true" />
    </label>
  )
}

export function DeltaPill({ delta, lowerBetter = false, className = '' }) {
  if (delta == null || !Number.isFinite(delta)) return null
  const flat = Math.abs(delta) < 0.05
  const good = lowerBetter ? delta < 0 : delta > 0
  const color = flat ? 'text-ink-faint bg-card-alt' : good ? 'text-positive bg-positive/10' : 'text-negative bg-negative/10'
  const arrow = flat ? '→' : delta > 0 ? '▲' : '▼'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular ${color} ${className}`}>
      <span aria-hidden="true" className="text-[8px]">
        {arrow}
      </span>
      {Math.abs(delta).toFixed(Math.abs(delta) >= 100 ? 0 : 1)}%
    </span>
  )
}

export function Sparkline({ values, color = 'var(--accent)', height = 34, className = '' }) {
  if (!values || values.length < 2) return <div style={{ height }} className={className} />
  const w = 120
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, height - 3 - ((v - min) / span) * (height - 8)])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${d} L${w} ${height} L0 ${height} Z`
  const gid = `sp-${Math.abs(values.reduce((s, v, i) => s + v * (i + 1), 0) | 0)}-${values.length}`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={`w-full ${className}`} style={{ height }} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
