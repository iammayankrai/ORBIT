import { ArrowUpRight } from 'lucide-react'
import founderPhoto from '../../assets/mayank-rai.jpg'
import Container from '../ui/Container.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import Button from '../ui/Button.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'
import { LinkedinIcon } from '../layout/BrandIcons.jsx'
import { FOUNDER } from '../../config/brand.js'

export default function About() {
  return (
    <section id="about" className="py-24 sm:py-32">
      <Container>
        <SectionHeader
          eyebrow="About"
          title="The person behind Orbit."
          description="Designed, built and deployed end to end — the landing experience, the dashboards, the AI Analyst, and the infrastructure behind them."
        />

        <div className="mx-auto mt-16 grid max-w-3xl items-center gap-10 sm:grid-cols-[220px_1fr]">
          <RevealOnScroll className="mx-auto w-48 sm:w-full">
            <img
              src={founderPhoto}
              alt={FOUNDER.name}
              className="aspect-[3/4] w-full rounded-3xl border border-border object-cover shadow-card-lg"
            />
          </RevealOnScroll>

          <RevealOnScroll delay={0.1} className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
            <div>
              <h3 className="text-xl font-semibold text-ink">{FOUNDER.name}</h3>
              <p className="mt-1 text-ink-soft">
                {FOUNDER.role} — {FOUNDER.tagline}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {FOUNDER.stack.map((item) => (
                <span key={item} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-ink-faint">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-1 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Button href={FOUNDER.portfolio} variant="secondary" size="md">
                View Portfolio <ArrowUpRight size={15} aria-hidden="true" />
              </Button>
              <Button href={FOUNDER.linkedin} variant="ghost" size="md" className="border border-border">
                <LinkedinIcon size={15} /> Connect on LinkedIn
              </Button>
            </div>
          </RevealOnScroll>
        </div>
      </Container>
    </section>
  )
}
