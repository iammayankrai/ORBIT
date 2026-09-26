import { BrainCircuit, Database, LayoutDashboard, Server } from 'lucide-react'
import Container from '../ui/Container.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'

const PILLARS = [
  { icon: Database, title: 'Data Engineering', description: 'Large datasets processed efficiently using Python and SQL.' },
  { icon: BrainCircuit, title: 'AI', description: 'Natural-language business analysis and automated insights.' },
  { icon: Server, title: 'API', description: 'FastAPI backend connecting analytics, AI and business logic.' },
  { icon: LayoutDashboard, title: 'Experience', description: 'Modern React interface designed for decision makers.' },
]

const STACK = ['Python', 'SQL', 'FastAPI', 'React', 'PostgreSQL']

export default function TechnologySection() {
  return (
    <section id="technology" className="py-24 sm:py-32">
      <Container>
        <SectionHeader eyebrow="Technology" title="Built for real business data." />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, description }, i) => (
            <RevealOnScroll key={title} delay={i * 0.06} className="rounded-2xl border border-border p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-alt text-ink">
                <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{description}</p>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll delay={0.2} className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
          {STACK.map((tech) => (
            <span key={tech} className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-ink-faint">
              {tech}
            </span>
          ))}
        </RevealOnScroll>
      </Container>
    </section>
  )
}
