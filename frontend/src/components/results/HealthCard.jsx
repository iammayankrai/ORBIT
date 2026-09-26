import RevealOnScroll from '../ui/RevealOnScroll.jsx'
import { num } from '../../utils/format.js'

function scoreTone(score) {
  if (score >= 85) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export default function HealthCard({ health, datasetName }) {
  const stats = [
    { label: 'Rows analyzed', value: num(health.rows_analyzed) },
    { label: 'Columns detected', value: String(health.columns_detected) },
    { label: 'Missing values', value: `${health.missing_pct}%` },
    { label: 'Duplicate rows', value: `${health.duplicate_pct}%` },
    { label: 'Potential anomalies', value: String(health.anomaly_count) },
  ]
  if (health.date_span_label) stats.push({ label: 'Date range', value: health.date_span_label })

  return (
    <RevealOnScroll className="rounded-2xl border border-border bg-white p-6 sm:p-8">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-ink-faint">Dataset analyzed</p>
          <h3 className="mt-1 truncate text-lg font-semibold text-ink" title={datasetName}>
            {datasetName}
          </h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-semibold tracking-tight ${scoreTone(health.score)}`}>{health.score}</span>
          <span className="text-sm leading-tight text-ink-faint">
            / 100
            <br />
            Data Health
          </span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-5 border-t border-border pt-6 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xs text-ink-faint">{s.label}</p>
            <p className="mt-1 text-[15px] font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>
    </RevealOnScroll>
  )
}
