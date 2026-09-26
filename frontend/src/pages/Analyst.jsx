import { Info } from 'lucide-react'
import Container from '../components/ui/Container.jsx'
import AIChat from '../components/ai/AIChat.jsx'
import RevealOnScroll from '../components/ui/RevealOnScroll.jsx'

export default function Analyst() {
  return (
    <div className="pb-24 pt-32 sm:pt-40">
      <Container className="max-w-3xl">
        <RevealOnScroll className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">AI Business Analyst</span>
          <h1 className="mt-3 text-balance text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">
            Ask a question about the demo business.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-ink-soft">
            You're exploring a realistic synthetic FMCG business. Ask about revenue, regions, products, inventory or sales
            targets — the analyst answers from the same underlying data every chart on this site uses.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1} className="mt-10 rounded-[28px] border border-border bg-white p-5 shadow-card-lg sm:p-8">
          <AIChat title="Business Analyst" />
        </RevealOnScroll>

        <RevealOnScroll delay={0.15} className="mt-6 flex items-start gap-2.5 rounded-xl bg-surface-alt px-4 py-3.5 text-sm text-ink-faint">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Free demo — up to 5 AI questions per day. Answers come from live AI analysis when configured, and from a
            realistic demo engine otherwise, so this page always works.
          </span>
        </RevealOnScroll>
      </Container>
    </div>
  )
}
