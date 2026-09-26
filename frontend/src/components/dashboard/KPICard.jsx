import { inr, num, pct } from '../../utils/format.js'
import DeltaBadge from '../ui/DeltaBadge.jsx'
import Sparkline from '../ui/Sparkline.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'

function formatValue(value, unit) {
  if (unit === 'cr') return inr(value)
  if (unit === 'pct') return pct(value, { decimals: 1 })
  return num(value)
}

function CardBody({ label, value, unit, deltaPct, goodDirection, sparkline }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-ink-soft">{label}</p>
        {sparkline && <Sparkline data={sparkline} width={48} height={20} />}
      </div>
      <p className="mt-1.5 whitespace-nowrap text-[21px] font-semibold tracking-tight text-ink sm:text-[24px]">
        {formatValue(value, unit)}
      </p>
      {deltaPct !== null && deltaPct !== undefined && (
        <div className="mt-2 flex items-center gap-1.5">
          <DeltaBadge value={deltaPct} goodDirection={goodDirection} />
          <span className="text-xs text-ink-faint">vs prior</span>
        </div>
      )}
    </>
  )
}

// `reveal=false` when a parent already owns the entrance animation (e.g. the
// hero's dashboard preview fades in as one unit — these cards shouldn't also
// wait on their own scroll-triggered reveal, or they can get stuck invisible
// below the fold on short viewports).
export default function KPICard({ label, value, unit, deltaPct, goodDirection = 'up', sparkline, delay = 0, reveal = true }) {
  const className = 'rounded-2xl border border-border bg-white p-4 shadow-card transition-shadow duration-300 hover:shadow-card-lg'
  const props = { label, value, unit, deltaPct, goodDirection, sparkline }

  if (!reveal) {
    return (
      <div className={className}>
        <CardBody {...props} />
      </div>
    )
  }

  return (
    <RevealOnScroll delay={delay} className={className}>
      <CardBody {...props} />
    </RevealOnScroll>
  )
}
