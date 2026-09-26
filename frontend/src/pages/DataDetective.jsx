import { Search } from 'lucide-react'
import Container from '../components/ui/Container.jsx'
import RevealOnScroll from '../components/ui/RevealOnScroll.jsx'
import { DETECTIVE_CASE } from '../data/detectiveCase.js'
import { inr, pct } from '../utils/format.js'
import InvestigationPanel from '../components/detective/InvestigationPanel.jsx'
import CaseChat from '../components/detective/CaseChat.jsx'
import CaseConclusion from '../components/detective/CaseConclusion.jsx'

export default function DataDetective() {
  return (
    <div className="pb-24 pt-32 sm:pt-40">
      <Container className="max-w-5xl">
        <RevealOnScroll className="text-center">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-accent">
            <Search size={14} aria-hidden="true" />
            Data Detective
          </span>
          <h1 className="mt-3 text-balance text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">
            {DETECTIVE_CASE.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-ink-soft">{DETECTIVE_CASE.premise}</p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1} className="mx-auto mt-8 flex max-w-md items-center justify-center gap-6 rounded-2xl border border-border bg-white px-6 py-4">
          <div className="text-center">
            <p className="text-xs text-ink-faint">{DETECTIVE_CASE.priorLabel}</p>
            <p className="text-lg font-semibold text-ink">{inr(DETECTIVE_CASE.totalPrior)}</p>
          </div>
          <div className="text-ink-faint">→</div>
          <div className="text-center">
            <p className="text-xs text-ink-faint">{DETECTIVE_CASE.currentLabel}</p>
            <p className="text-lg font-semibold text-ink">{inr(DETECTIVE_CASE.totalCurrent)}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-xs text-ink-faint">Decline</p>
            <p className="text-lg font-semibold text-red-700">-{pct(DETECTIVE_CASE.declinePct, { decimals: 1 })}</p>
          </div>
        </RevealOnScroll>

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:items-start">
          <RevealOnScroll delay={0.15}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">Investigate</h2>
            <InvestigationPanel />
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">Discuss</h2>
            <CaseChat />
          </RevealOnScroll>
        </div>

        <RevealOnScroll delay={0.1} className="mt-8">
          <CaseConclusion />
        </RevealOnScroll>
      </Container>
    </div>
  )
}
