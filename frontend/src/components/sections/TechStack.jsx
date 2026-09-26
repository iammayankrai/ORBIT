import Container from '../ui/Container.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'

// Exactly what's actually running — kept in sync with frontend/package.json
// and backend/requirements.txt rather than a generic "our tech" list.
const STACK = ['React', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'FastAPI', 'Python', 'Pandas', 'Gemini API']

export default function TechStack() {
  return (
    <section className="border-y border-border bg-surface-alt/40 py-14 sm:py-16">
      <Container className="flex flex-col items-center gap-6 text-center">
        <RevealOnScroll>
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Built with</p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.06} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {STACK.map((tech) => (
            <span key={tech} className="text-[15px] font-medium text-ink-soft">
              {tech}
            </span>
          ))}
        </RevealOnScroll>
      </Container>
    </section>
  )
}
