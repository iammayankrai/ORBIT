import { Boxes, LineChart, TrendingUp, Wrench } from 'lucide-react'
import Container from '../ui/Container.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'

const CASES = [
  { icon: TrendingUp, title: 'Sales', description: 'Understand revenue, targets, regions and products.' },
  { icon: Boxes, title: 'Inventory', description: 'Identify ageing, slow-moving and high-risk stock.' },
  { icon: LineChart, title: 'Finance', description: 'Monitor business performance and financial trends.' },
  { icon: Wrench, title: 'Operations', description: 'Turn operational data into actionable insights.' },
]

export default function UseCases() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <SectionHeader eyebrow="Use Cases" title="Built for every part of the business." />
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CASES.map(({ icon: Icon, title, description }, i) => (
            <RevealOnScroll
              key={title}
              delay={i * 0.06}
              className="rounded-2xl border border-border bg-white p-6 shadow-card transition-shadow hover:shadow-card-lg"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{description}</p>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  )
}
