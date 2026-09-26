import { Boxes, Radar, Sparkles, TrendingUp } from 'lucide-react'
import Container from '../ui/Container.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'

const CAPABILITIES = [
  { icon: TrendingUp, title: 'Sales Intelligence', description: 'Revenue, targets, regions and products in one connected view.' },
  { icon: Boxes, title: 'Inventory Intelligence', description: 'Know what to stock, what to discount, and what to reorder.' },
  { icon: Sparkles, title: 'AI Analyst', description: 'Ask questions in plain language, get data-backed answers.' },
  { icon: Radar, title: 'Automated Insights', description: 'Anomalies and risks surfaced before you go looking for them.' },
]

export default function TrustStrip() {
  return (
    <section className="border-y border-border bg-surface-alt/40 py-16 sm:py-20">
      <Container>
        <RevealOnScroll className="text-center">
          <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">One platform. Your entire business.</h2>
        </RevealOnScroll>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map(({ icon: Icon, title, description }, i) => (
            <RevealOnScroll key={title} delay={i * 0.08} className="flex flex-col items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  )
}
