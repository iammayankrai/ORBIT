import { STATUS } from '../../utils/chartTheme.js'
import { inr } from '../../utils/format.js'

function severityColor(attainmentPct) {
  if (attainmentPct >= 95) return STATUS.good
  if (attainmentPct >= 85) return STATUS.warning
  return STATUS.critical
}

// Meter: fill carries severity, unfilled track is a lighter step of the same
// idea (neutral gray), with a tick marking the target.
export default function TargetMeterList({ data, nameKey = 'name', actualKey = 'july', targetKey = 'target' }) {
  const max = Math.max(...data.map((d) => Math.max(d[actualKey], d[targetKey]))) * 1.05

  return (
    <div className="flex flex-col gap-5">
      {data.map((row) => {
        const attainment = (row[actualKey] / row[targetKey]) * 100
        const color = severityColor(attainment)
        const actualPct = (row[actualKey] / max) * 100
        const targetPct = (row[targetKey] / max) * 100
        return (
          <div key={row[nameKey]}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium text-ink">{row[nameKey]}</span>
              <span className="text-ink-soft">
                {inr(row[actualKey])} <span className="text-ink-faint">of {inr(row[targetKey])} target</span>
              </span>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-surface-alt">
              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(actualPct, 100)}%`, background: color }} />
              <div
                className="absolute top-1/2 h-4 w-[2px] -translate-y-1/2 bg-ink/70"
                style={{ left: `${Math.min(targetPct, 100)}%` }}
                aria-hidden="true"
              />
            </div>
            <p className="mt-1 text-xs text-ink-faint">{Math.round(attainment)}% of target</p>
          </div>
        )
      })}
    </div>
  )
}
