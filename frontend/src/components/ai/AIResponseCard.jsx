import { useState } from 'react'
import { ChevronDown, Lightbulb } from 'lucide-react'
import RevenueTrendChart from '../charts/RevenueTrendChart.jsx'
import DumbbellChart from '../charts/DumbbellChart.jsx'
import CategoryDonut from '../charts/CategoryDonut.jsx'
import RankedBarChart from '../charts/RankedBarChart.jsx'
import { formatByUnit } from '../../utils/format.js'

function Chart({ chart }) {
  if (!chart || chart.type === 'none') return null
  if (chart.type === 'trend') {
    return <RevenueTrendChart data={chart.data} height={220} xKey={chart.xKey} yKey={chart.yKey} unit={chart.unit} />
  }
  if (chart.type === 'donut') {
    return <CategoryDonut data={chart.data} nameKey={chart.nameKey} valueKey={chart.valueKey} unit={chart.unit} height={200} />
  }
  if (chart.type === 'dumbbell') {
    return (
      <DumbbellChart
        data={chart.data}
        nameKey={chart.nameKey}
        priorKey={chart.priorKey}
        currentKey={chart.currentKey}
        changeKey={chart.changeKey}
        priorLabel={chart.priorLabel}
        currentLabel={chart.currentLabel}
      />
    )
  }
  if (chart.type === 'bar-horizontal') {
    return (
      <RankedBarChart
        data={chart.data}
        nameKey={chart.nameKey}
        valueKey={chart.valueKey}
        suffix={chart.suffix}
        colorBySign={Boolean(chart.colorBySign)}
        formatter={chart.unit ? (v) => formatByUnit(v, chart.unit) : undefined}
      />
    )
  }
  return null
}

const IMPACT_DOT = {
  primary: 'bg-red-500',
  negative: 'bg-red-500',
  secondary: 'bg-ink-faint',
  positive: 'bg-emerald-500',
}

export default function AIResponseCard({ response }) {
  const [basisOpen, setBasisOpen] = useState(false)
  const { answer, metrics, drivers, chart, recommendation, basis } = response

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
      <p className="text-[17px] leading-relaxed text-ink">{answer}</p>

      {metrics?.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-surface-alt px-3.5 py-3">
              <p className="text-xs text-ink-faint">{m.label}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-ink" title={m.value}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {drivers?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Key drivers</p>
          <ul className="flex flex-col gap-2">
            {drivers.map((d) => (
              <li key={d.label} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${IMPACT_DOT[d.impact] || 'bg-ink-faint'}`} />
                <span>
                  <span className="font-medium text-ink">{d.label}</span>
                  {d.value && <span className="text-ink-soft"> — {d.value}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {chart && chart.type !== 'none' && (
        <div className="border-t border-border pt-5">
          <Chart chart={chart} />
        </div>
      )}

      {recommendation && (
        <div className="flex gap-3 rounded-xl bg-accent-soft px-4 py-3.5">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-accent-dark" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Recommended action</p>
            <p className="mt-1 text-sm leading-relaxed text-ink">{recommendation}</p>
          </div>
        </div>
      )}

      {basis && (
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setBasisOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-ink-soft"
            aria-expanded={basisOpen}
          >
            <ChevronDown size={14} className={`transition-transform ${basisOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            How this was calculated
          </button>
          {basisOpen && <p className="mt-2 text-xs leading-relaxed text-ink-faint">{basis}</p>}
        </div>
      )}
    </div>
  )
}
