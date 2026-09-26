import { MessageCircleQuestion, ScanSearch, Upload, LayoutDashboard } from 'lucide-react'
import Container from '../ui/Container.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'

const STEPS = [
  { icon: Upload, title: 'Upload', description: 'Drop your Excel or CSV file — or try the sample dataset, no file needed.' },
  { icon: ScanSearch, title: 'Analyze', description: 'We detect columns, data types and data quality automatically.' },
  { icon: LayoutDashboard, title: 'Visualize', description: 'Dashboards and KPIs are generated from your actual data — nothing hardcoded.' },
  { icon: MessageCircleQuestion, title: 'Ask', description: 'Ask a plain-language question and get an answer with the numbers behind it.' },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-surface-alt/40 py-16 sm:py-20">
      <Container>
        <RevealOnScroll className="text-center">
          <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Upload → Analyze → Visualize → Ask.</h2>
        </RevealOnScroll>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <RevealOnScroll key={title} delay={i * 0.08} className="flex flex-col items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="text-[15px] font-semibold text-ink">
                <span className="mr-1.5 text-ink-faint">{i + 1}.</span>
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  )
}
