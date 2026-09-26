import { AlertTriangle, Info, TrendingDown, TrendingUp } from 'lucide-react'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'

const ICONS = {
  positive: { Icon: TrendingUp, className: 'bg-emerald-50 text-emerald-600' },
  negative: { Icon: TrendingDown, className: 'bg-red-50 text-red-600' },
  warning: { Icon: AlertTriangle, className: 'bg-amber-50 text-amber-600' },
  info: { Icon: Info, className: 'bg-surface-alt text-ink-faint' },
}

export default function InsightsList({ insights }) {
  if (!insights?.length) return null

  return (
    <div className="flex flex-col gap-3">
      {insights.map((insight, i) => {
        const { Icon, className } = ICONS[insight.type] || ICONS.info
        return (
          <RevealOnScroll
            key={`${insight.type}-${i}`}
            delay={i * 0.05}
            className="flex items-start gap-3.5 rounded-2xl border border-border bg-white px-5 py-4"
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className}`}>
              <Icon size={16} aria-hidden="true" />
            </span>
            <p className="text-[15px] leading-relaxed text-ink">{insight.text}</p>
          </RevealOnScroll>
        )
      })}
    </div>
  )
}
