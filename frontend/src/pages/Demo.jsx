import { ArrowRight, LayoutDashboard, Search, Sparkles } from 'lucide-react'
import Container from '../components/ui/Container.jsx'
import Button from '../components/ui/Button.jsx'
import RevealOnScroll from '../components/ui/RevealOnScroll.jsx'

const EXPERIENCES = [
  {
    icon: LayoutDashboard,
    title: 'Business Dashboard',
    description: 'Explore a full sales and operations dashboard built on realistic synthetic data.',
    cta: 'View dashboard',
    to: '/#product',
  },
  {
    icon: Sparkles,
    title: 'AI Analyst',
    description: 'Ask business questions in plain language and get data-backed, explained answers.',
    cta: 'Ask a question',
    to: '/analyst',
  },
  {
    icon: Search,
    title: 'Data Detective',
    description: 'Investigate a real revenue mystery using the same tools a business analyst would.',
    cta: 'Start investigating',
    to: '/data-detective',
  },
]

export default function Demo() {
  return (
    <div className="pb-24 pt-32 sm:pt-40">
      <Container className="max-w-4xl">
        <RevealOnScroll className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">Free Demo</span>
          <h1 className="mt-3 text-balance text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">
            Explore the product.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-ink-soft">
            No account needed. Pick a starting point — everything runs on the same synthetic business dataset.
          </p>
        </RevealOnScroll>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {EXPERIENCES.map(({ icon: Icon, title, description, cta, to }, i) => (
            <RevealOnScroll
              key={title}
              delay={i * 0.08}
              className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-card"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-[15px] font-semibold text-ink">{title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">{description}</p>
              <Button to={to} variant="ghost" size="md" className="mt-5 justify-start px-0 text-accent-dark hover:bg-transparent hover:underline">
                {cta} <ArrowRight size={15} aria-hidden="true" />
              </Button>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </div>
  )
}
