import { Search } from 'lucide-react'
import Container from '../ui/Container.jsx'
import Button from '../ui/Button.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'
import { DETECTIVE_CASE, REGION_CLUES } from '../../data/detectiveCase.js'
import { inr, pct } from '../../utils/format.js'

export default function DataDetectiveTeaser() {
  const worst = [...REGION_CLUES].sort((a, b) => a.changePct - b.changePct)[0]

  return (
    <section id="solutions" className="border-y border-border bg-surface-dark py-24 text-white sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <RevealOnScroll>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-white/60">
            <Search size={14} aria-hidden="true" />
            Interactive challenge
          </span>
          <h2 className="mt-3 text-balance text-[32px] font-semibold leading-tight tracking-tight sm:text-[42px]">
            Become the Data Detective.
          </h2>
          <p className="mt-4 max-w-md text-balance text-white/60">{DETECTIVE_CASE.premise}</p>
          <Button to="/data-detective" variant="accent" size="lg" className="mt-8">
            Start investigating
          </Button>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-white/40">Case file</p>
          <div className="mt-3 flex items-center gap-4">
            <div>
              <p className="text-2xl font-semibold">{inr(DETECTIVE_CASE.totalPrior)}</p>
              <p className="text-xs text-white/40">{DETECTIVE_CASE.priorLabel}</p>
            </div>
            <span className="text-white/30">→</span>
            <div>
              <p className="text-2xl font-semibold">{inr(DETECTIVE_CASE.totalCurrent)}</p>
              <p className="text-xs text-white/40">{DETECTIVE_CASE.currentLabel}</p>
            </div>
            <span className="ml-auto rounded-full bg-red-500/15 px-3 py-1 text-sm font-semibold text-red-400">
              -{pct(DETECTIVE_CASE.declinePct, { decimals: 1 })}
            </span>
          </div>
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-sm text-white/50">First clue, free:</p>
            <p className="mt-1.5 text-sm text-white/80">
              <span className="font-semibold text-white">{worst.region}</span> region moved {pct(worst.changePct, { signed: true })} —
              every other region barely moved. Can you find out why?
            </p>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  )
}
