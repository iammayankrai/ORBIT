import { Check } from 'lucide-react'
import Container from '../ui/Container.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'
import Button from '../ui/Button.jsx'

const AI_DAILY_LIMIT = import.meta.env.VITE_AI_DAILY_LIMIT || 5

const FEATURES = [
  'Synthetic business dataset',
  'Interactive dashboards',
  'AI Analyst',
  `${AI_DAILY_LIMIT} AI questions/day`,
  'No credit card',
]

export default function Pricing() {
  return (
    <section className="py-24 sm:py-32">
      <Container className="flex flex-col items-center">
        <SectionHeader eyebrow="Pricing" title="Start exploring for free." />

        <RevealOnScroll delay={0.1} className="mt-12 w-full max-w-md rounded-[28px] border border-border bg-white p-8 shadow-card-lg">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Free Demo</p>
          <ul className="mt-5 flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[15px] text-ink-soft">
                <Check size={16} className="shrink-0 text-accent" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          <Button to="/analyst" variant="accent" size="lg" className="mt-7 w-full">
            Try Free Demo
          </Button>
          <p className="mt-4 text-center text-xs text-ink-faint">Built for exploration. No payment required.</p>
        </RevealOnScroll>
      </Container>
    </section>
  )
}
