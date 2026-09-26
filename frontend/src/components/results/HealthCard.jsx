import { RotateCcw } from 'lucide-react'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'
import Button from '../ui/Button.jsx'
import { num } from '../../utils/format.js'

function scoreTone(score) {
  if (score >= 85) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

// The dashboard's header: dataset name, health score and reset action live
// in one compact bar, with the health stats as a thin strip underneath —
// replacing what used to be a giant centered title plus a separate,
// much taller health card.
export default function HealthCard({ health, datasetName, onReset }) {
  const stats = [
    { label: 'Rows', value: num(health.rows_analyzed) },
    { label: 'Columns', value: String(health.columns_detected) },
    { label: 'Missing', value: `${health.missing_pct}%` },
    { label: 'Duplicates', value: `${health.duplicate_pct}%` },
    { label: 'Anomalies', value: String(health.anomaly_count) },
  ]
  if (health.date_span_label) stats.push({ label: 'Date range', value: health.date_span_label })

  return (
    <RevealOnScroll className="rounded-2xl border border-border bg-white px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Results</p>
          <h2 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-ink sm:text-xl" title={datasetName}>
            {datasetName}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5 whitespace-nowrap rounded-xl bg-surface-alt px-3.5 py-2">
            <span className={`text-2xl font-semibold tracking-tight ${scoreTone(health.score)}`}>{health.score}</span>
            <span className="text-xs text-ink-faint">/100 Health</span>
          </div>
          <Button as="button" type="button" variant="secondary" size="sm" onClick={onReset}>
            <RotateCcw size={13} aria-hidden="true" /> Analyse a different file
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1.5 border-t border-border pt-3.5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <span className="text-[13px] text-ink-faint">{s.label}</span>
            <span className="text-[13px] font-semibold text-ink">{s.value}</span>
          </div>
        ))}
      </div>
    </RevealOnScroll>
  )
}
