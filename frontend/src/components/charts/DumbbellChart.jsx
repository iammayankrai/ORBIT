import { useState } from 'react'
import { STATUS } from '../../utils/chartTheme.js'
import { inr, pct } from '../../utils/format.js'

// "Before -> after per item": a muted dot for the prior period and a status-
// colored dot for the current period, connected by a line. Built by hand —
// Recharts has no native dumbbell mark.
export default function DumbbellChart({
  data,
  priorKey = 'june',
  currentKey = 'july',
  nameKey = 'name',
  changeKey = 'changePct',
  priorLabel = 'June',
  currentLabel = 'July',
}) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(...data.flatMap((d) => [d[priorKey], d[currentKey]]))
  const scale = (v) => 8 + (v / max) * 76 // percent across the track, with padding

  return (
    <div role="img" aria-label={`Comparison of ${priorLabel} versus ${currentLabel}, by ${nameKey}`}>
      <div className="mb-3 flex items-center gap-4 text-xs text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ink-faint" /> {priorLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: STATUS.critical }} /> {currentLabel} (change)
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {data.map((row, i) => {
          const isDown = row[changeKey] < 0
          const dotColor = isDown ? STATUS.critical : STATUS.good
          const x1 = scale(row[priorKey])
          const x2 = scale(row[currentKey])
          const isHovered = hovered === row[nameKey]
          return (
            <div
              key={`${row[nameKey]}-${i}`}
              className="group"
              onMouseEnter={() => setHovered(row[nameKey])}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink">{row[nameKey]}</span>
                <span className={isDown ? 'text-red-700' : 'text-emerald-700'}>{pct(row[changeKey], { signed: true })}</span>
              </div>
              <svg viewBox="0 0 100 16" className="h-4 w-full overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1="8" x2="100" y2="8" stroke="#eef0f3" strokeWidth="1" />
                <line x1={x1} y1="8" x2={x2} y2="8" stroke={isHovered ? dotColor : '#c3c2b7'} strokeWidth="2" strokeLinecap="round" />
                <circle cx={x1} cy="8" r="3.5" fill="#c3c2b7" stroke="#fff" strokeWidth="1.5" />
                <circle cx={x2} cy="8" r="4" fill={dotColor} stroke="#fff" strokeWidth="1.5" />
              </svg>
              {isHovered && (
                <div className="mt-1 flex justify-between text-xs text-ink-faint">
                  <span>{inr(row[priorKey])}</span>
                  <span>{inr(row[currentKey])}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
