import { AlertTriangle, Info, TrendingDown, TrendingUp } from 'lucide-react'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'

const ICONS = {
  positive: { Icon: TrendingUp, className: 'bg-emerald-50 text-emerald-600' },
  negative: { Icon: TrendingDown, className: 'bg-red-50 text-red-600' },
  warning: { Icon: AlertTriangle, className: 'bg-amber-50 text-amber-600' },
  info: { Icon: Info, className: 'bg-surface-alt text-ink-faint' },
}

// A dense grid, not a tall single-column stack — 5 insights should read as
// one compact block, not a quarter of the page.
export default function InsightsList({ insights }) {
  if (!insights?.length) return null

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight, i) => {
        const { Icon, className } = ICONS[insight.type] || ICONS.info
        return (
          <RevealOnScroll
            key={`${insight.type}-${i}`}
            delay={i * 0.04}
            className="flex items-start gap-2.5 rounded-xl border border-border bg-white px-4 py-3"
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${className}`}>
              <Icon size={13} aria-hidden="true" />
            </span>
            <p className="text-[13.5px] leading-snug text-ink">{insight.text}</p>
          </RevealOnScroll>
        )
      })}
    </div>
  )
}
