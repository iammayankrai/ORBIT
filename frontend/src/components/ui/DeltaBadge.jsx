import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { pct } from '../../utils/format.js'

// `goodDirection`: 'up' means positive change is good (revenue), 'down' means
// negative change is good (e.g. cost, ageing value).
export default function DeltaBadge({ value, goodDirection = 'up', decimals = 1 }) {
  const isUp = value > 0
  const isGood = goodDirection === 'up' ? isUp : !isUp
  const tone = value === 0 ? 'text-ink-faint' : isGood ? 'text-emerald-700' : 'text-red-700'
  const Icon = isUp ? ArrowUpRight : ArrowDownRight

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${tone}`}>
      <Icon size={15} strokeWidth={2.25} aria-hidden="true" />
      {pct(Math.abs(value), { decimals })}
    </span>
  )
}
