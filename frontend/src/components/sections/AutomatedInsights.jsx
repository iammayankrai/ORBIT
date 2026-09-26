import { Bell, TrendingDown, TrendingUp } from 'lucide-react'
import Container from '../ui/Container.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'
import { WEEKLY_INSIGHT } from '../../data/businessData.js'
import { pct } from '../../utils/format.js'

const CAPABILITIES = [
  'Revenue anomalies',
  'Inventory risks',
  'Target misses',
  'Regional declines',
  'Unusual customer behaviour',
]

export default function AutomatedInsights() {
  return (
    <section className="border-y border-border bg-surface-alt/40 py-24 sm:py-32">
      <Container className="grid gap-14 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeader
            align="left"
            eyebrow="Automated Insights"
            title="Your business shouldn't wait for a report."
            description="The system can automatically identify what needs your attention — before you go looking for it."
          />
          <ul className="mt-8 flex flex-col gap-3">
            {CAPABILITIES.map((c, i) => (
              <RevealOnScroll key={c} delay={i * 0.05} as="li" className="flex items-center gap-3 text-ink-soft">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {c}
              </RevealOnScroll>
            ))}
          </ul>
        </div>

        <RevealOnScroll delay={0.1} className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-white p-5 shadow-card-lg">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
              <Bell size={15} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Weekly Business Insight</p>
              <p className="text-xs text-ink-faint">Delivered every Monday, 9:00 AM</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
            <TrendingUp size={16} className="shrink-0" aria-hidden="true" />
            Revenue increased {pct(WEEKLY_INSIGHT.revenueChangePct, { signed: true })} this week.
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-800">
            <TrendingDown size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              However, {WEEKLY_INSIGHT.decliningRegion} region declined{' '}
              {pct(Math.abs(WEEKLY_INSIGHT.decliningRegionChangePct), { signed: false })}. {WEEKLY_INSIGHT.contributingProducts}{' '}
              products contributed {WEEKLY_INSIGHT.contributingShare}% of the decline.
            </span>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  )
}
