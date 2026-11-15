import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Filter, GitCompare, Grid3x3, Plus, ShieldCheck, Sparkles, Table2 } from 'lucide-react'
import { DemoArt } from '../components/home/art.jsx'
import HeroStage from '../components/home/HeroStage.jsx'
import UploadPanel from '../components/home/UploadPanel.jsx'
import Button from '../components/ui/Button.jsx'
import { FOUNDER } from '../config/brand.js'
import { DEMOS, FAQS, STORIES } from '../config/demos.js'
import founderPhoto from '../assets/mayank-rai.jpg'
import { usePrefersReducedMotion } from '../motion/hooks.js'
import Magnetic from '../motion/Magnetic.jsx'
import Marquee from '../motion/Marquee.jsx'
import { useMotionPhase } from '../motion/MotionProvider.jsx'
import OrbitRings from '../motion/OrbitRings.jsx'
import Parallax from '../motion/Parallax.jsx'
import { Reveal, RevealGroup, RevealItem } from '../motion/Reveal.jsx'
import Spotlight from '../motion/Spotlight.jsx'
import SplitReveal from '../motion/SplitReveal.jsx'
import usePointerDepth from '../motion/usePointerDepth.js'
import { EASE_OUT, SPRING_SOFT } from '../motion/tokens.js'
import { wakeBackend } from '../services/dataService.js'

const Section = ({ id, className = '', children }) => (
  <section id={id} className={`scroll-mt-20 ${className}`}>
    <div className="mx-auto max-w-7xl px-5 sm:px-8">{children}</div>
  </section>
)

// -------------------------------------------------------------------------
// Hero
// -------------------------------------------------------------------------

// One piece of hero copy: rises and fades once the opening sequence releases.
function HeroItem({ ready, delay = 0, className = '', children }) {
  const reduced = usePrefersReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 20 }} animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.9, ease: EASE_OUT, delay }}>
      {children}
    </motion.div>
  )
}

function Hero() {
  const { heroReady } = useMotionPhase()
  const reduced = usePrefersReducedMotion()
  const ref = useRef(null)
  const pointer = usePointerDepth(ref)

  // As the hero scrolls away the copy lifts and fades while the dashboards
  // trail behind it - the first "section transition" of the page.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -80])
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reduced ? 1 : 0.1])
  const stageY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 100])

  return (
    <section ref={ref} className="relative overflow-hidden pb-10 pt-28 sm:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[620px]">
        <div className="glow-drift h-full w-full" style={{ background: 'radial-gradient(60% 55% at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)' }} />
      </div>
      <OrbitRings />
      <div className="relative mx-auto max-w-7xl px-5 text-center sm:px-8">
        <motion.div style={{ y: copyY, opacity: copyOpacity }}>
          <HeroItem ready={heroReady} delay={0.05}>
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-[12.5px] font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-positive" /> Live demos · no sign-up
            </p>
          </HeroItem>
          <SplitReveal as="h1" text={'Turn your data\ninto decisions.'} play={heroReady} delay={0.15} blur={9} duration={1.05} stagger={0.075} className="display mx-auto mt-7 max-w-4xl text-[clamp(46px,8.4vw,108px)] text-ink text-balance" />
          <HeroItem ready={heroReady} delay={0.85}>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft sm:text-[18px]">Drop in any Excel or CSV and get a full interactive dashboard in seconds — KPIs, trends, breakdowns, data quality and plain-English answers.</p>
          </HeroItem>
          <HeroItem ready={heroReady} delay={0.97} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Button to="/#upload" size="lg">
                Upload your data <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Magnetic>
            <Magnetic>
              <Button to="/#demos" size="lg" variant="secondary">
                Explore live demos
              </Button>
            </Magnetic>
          </HeroItem>
        </motion.div>
        <motion.div style={{ y: stageY }}>
          <HeroStage ready={heroReady} pointer={pointer} />
        </motion.div>
      </div>
    </section>
  )
}

// -------------------------------------------------------------------------
// Demos
// -------------------------------------------------------------------------

function DemoCard({ demo, index }) {
  return (
    <RevealItem rotate={index % 2 ? 2.5 : -2.5} y={70} className="h-full">
      <Spotlight
        as={Link}
        to={`/dashboard?demo=${demo.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card transition-[transform,border-color,box-shadow] duration-500 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:border-line-strong hover:shadow-lift"
      >
        <div className="aspect-[16/10] overflow-hidden border-b border-line">
          <div className="h-full w-full transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.06]">
            <DemoArt kind={demo.kind} color={demo.color} />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow">{demo.domain}</span>
            <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent-dark">
              Live Demo <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
          <h3 className="mt-3 text-[22px] font-semibold tracking-tight text-ink">{demo.title}</h3>
          <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-ink-soft">{demo.blurb}</p>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4 font-mono text-[11.5px] uppercase tracking-wide text-ink-faint">
            {demo.stats.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </Spotlight>
    </RevealItem>
  )
}

function Demos() {
  return (
    <Section id="demos" className="py-20 sm:py-28">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <Reveal>
            <p className="eyebrow">Demos</p>
          </Reveal>
          <SplitReveal text="Explore, filter & experience live dashboards." className="display mt-4 max-w-2xl text-[clamp(36px,5.4vw,68px)] text-ink text-balance" />
        </div>
        <Reveal delay={0.15} className="max-w-sm">
          <p className="text-[15.5px] leading-relaxed text-ink-soft">Six working dashboards on synthetic data — each one a full workspace you can slice, compare and question. Or bring your own file.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button to="/#upload" size="sm">
              Upload your data
            </Button>
            <Button to="/#process" size="sm" variant="secondary">
              How it works
            </Button>
          </div>
        </Reveal>
      </div>
      <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.09}>
        {DEMOS.map((d, i) => (
          <DemoCard key={d.id} demo={d} index={i} />
        ))}
      </RevealGroup>
    </Section>
  )
}

// -------------------------------------------------------------------------
// Statement: the words light up one by one as you scroll through the section
// -------------------------------------------------------------------------

const STATEMENT = 'Every spreadsheet already holds the answer. Orbit reads it, charts it and lets you ask it questions — so you decide with numbers, not guesses.'

function StatementWord({ word, progress, range }) {
  const opacity = useTransform(progress, range, [0.14, 1])
  return (
    <>
      <motion.span style={{ opacity }}>{word}</motion.span>{' '}
    </>
  )
}

function Statement() {
  const ref = useRef(null)
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const words = STATEMENT.split(' ')

  if (reduced) {
    return (
      <Section className="py-24">
        <p className="display mx-auto max-w-5xl text-center text-[clamp(30px,4.6vw,60px)] text-ink text-balance">{STATEMENT}</p>
      </Section>
    )
  }
  return (
    <section ref={ref} className="relative h-[190svh] sm:h-[230svh]" aria-label="Orbit in one sentence">
      <div className="sticky top-0 flex h-svh items-center">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="eyebrow text-center">Why Orbit</p>
          <p className="display mx-auto mt-6 max-w-5xl text-center text-[clamp(30px,4.8vw,64px)] text-ink text-balance">
            {words.map((w, i) => {
              const start = (i / words.length) * 0.82 + 0.04
              return <StatementWord key={i} word={w} progress={scrollYProgress} range={[start, start + 0.1]} />
            })}
          </p>
        </div>
      </div>
    </section>
  )
}

// -------------------------------------------------------------------------
// Process
// -------------------------------------------------------------------------

const STEPS = [
  { n: '01', t: 'Upload', d: 'Drop an Excel or CSV — or open a demo. No account, nothing to configure.' },
  { n: '02', t: 'Analyse', d: 'Orbit finds the date column, the measures and the categories, and scores the data’s health.' },
  { n: '03', t: 'Explore', d: 'A full workspace opens: KPIs, trends, breakdowns and heatmaps that all filter each other, instantly.' },
  { n: '04', t: 'Ask', d: 'Ask in plain English. The numbers come from your data; AI only phrases the explanation.' },
]

const TERMINAL = [
  ['$', 'orbit analyze Sales_Data_Demo.xlsx', 'cmd'],
  ['✓', 'read 12,471 rows · 14 columns', 'ok'],
  ['✓', 'date: Date · 5 measures · 7 dimensions', 'ok'],
  ['✓', 'data health 92 / 100 · 21 anomalies flagged', 'ok'],
  ['→', 'building cube in your browser…', 'run'],
  ['✓', 'dashboard ready — filters run locally, instantly', 'ok'],
]

function Terminal() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-[#0b0a09] shadow-lift" aria-hidden="true">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[11.5px] text-white/40">orbit — analysis</span>
      </div>
      <RevealGroup className="flex flex-col gap-2.5 p-5 font-mono text-[13px] leading-relaxed" stagger={0.42} delay={0.35}>
        {TERMINAL.map(([sym, text, kind], i) => (
          <RevealItem key={i} as="p" y={0} scale={1} duration={0.45} className="flex gap-3 text-[#f5f2eb]">
            <span className={kind === 'ok' ? 'text-[#43c28d]' : kind === 'run' ? 'text-[#f2b632]' : 'text-white/40'}>{sym}</span>
            <span className={kind === 'cmd' ? 'text-[#f5f2eb]' : 'text-white/75'}>{text}</span>
          </RevealItem>
        ))}
        <RevealItem as="p" y={0} scale={1} className="flex gap-3 text-white/40">
          <span>$</span>
          <span className="inline-block h-4 w-2 animate-pulse bg-white/60" />
        </RevealItem>
      </RevealGroup>
    </div>
  )
}

function StepRow({ step, index, progress, total }) {
  const at = (index + 0.4) / total
  const opacity = useTransform(progress, [at - 0.14, at], [0.38, 1])
  const dot = useTransform(progress, [at - 0.06, at], [0, 1])
  return (
    <li className="relative grid grid-cols-[48px_1fr] gap-4 border-t border-line py-5 pl-6">
      <motion.span style={{ scale: dot, opacity: dot }} className="absolute -left-[5px] top-[30px] h-[9px] w-[9px] rounded-full bg-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_25%,transparent)]" />
      <motion.span style={{ opacity }} className="font-mono text-[13px] text-accent-dark">
        {step.n}
      </motion.span>
      <motion.div style={{ opacity }}>
        <h3 className="text-[18px] font-semibold tracking-tight text-ink">{step.t}</h3>
        <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">{step.d}</p>
      </motion.div>
    </li>
  )
}

function Process() {
  const listRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 0.75', 'end 0.55'] })
  return (
    <Section id="process" className="py-20 sm:py-24">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <Reveal>
            <p className="eyebrow">Behind the build</p>
          </Reveal>
          <SplitReveal text="From spreadsheet to answer in four steps." className="display mt-4 text-[clamp(36px,5vw,62px)] text-ink text-balance" />
          <ol ref={listRef} className="relative mt-10 flex flex-col">
            <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px bg-line" />
            <motion.span aria-hidden="true" style={{ scaleY: scrollYProgress }} className="absolute bottom-0 left-0 top-0 w-px origin-top bg-accent" />
            {STEPS.map((s, i) => (
              <StepRow key={s.n} step={s} index={i} total={STEPS.length} progress={scrollYProgress} />
            ))}
          </ol>
        </div>
        <Parallax distance={28} scaleFrom={0.9}>
          <Terminal />
          <RevealGroup className="mt-4 grid grid-cols-3 gap-3 text-center" delay={0.5}>
            {[['React', 'in-browser cube'], ['FastAPI', 'schema detection'], ['pandas', 'the numbers']].map(([a, b]) => (
              <RevealItem key={a} y={20} className="rounded-xl border border-line bg-card px-3 py-3">
                <p className="text-[14px] font-semibold text-ink">{a}</p>
                <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wide text-ink-faint">{b}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Parallax>
      </div>
    </Section>
  )
}

// -------------------------------------------------------------------------
// Capabilities
// -------------------------------------------------------------------------

const CAPS = [
  { icon: Filter, t: 'Cross-filter everything', d: 'Click a bar, a slice or a legend entry and every chart, KPI and insight re-computes — no reload.' },
  { icon: GitCompare, t: 'Period-over-period', d: 'Every KPI is compared with the equally long period before it, with the dashed trend overlay to match.' },
  { icon: Grid3x3, t: 'Heatmaps & movers', d: 'See which region, product or manager is gaining or losing — by month, against the last period.' },
  { icon: ShieldCheck, t: 'Data health score', d: 'Completeness, duplicates and anomalies scored for the whole file, with a profile of every column.' },
  { icon: Sparkles, t: 'Ask in plain English', d: 'Questions are answered from the data first; AI is only used to phrase the explanation.' },
  { icon: Table2, t: 'Explore & export rows', d: 'Search, sort and page through the underlying rows, then export exactly what the filters show.' },
]

function Capabilities() {
  return (
    <Section id="capabilities" className="py-20 sm:py-24">
      <Reveal>
        <p className="eyebrow">Capabilities</p>
      </Reveal>
      <SplitReveal text="A real workspace, not a screenshot of one." className="display mt-4 max-w-3xl text-[clamp(36px,5vw,62px)] text-ink text-balance" />
      <RevealGroup className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
        {CAPS.map((c) => (
          <RevealItem key={c.t} y={32} scale={1} className="bg-card">
            <Spotlight className="group h-full p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-dark transition-transform duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1 group-hover:rotate-[-6deg] group-hover:scale-110">
                <c.icon size={19} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-ink">{c.t}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{c.d}</p>
            </Spotlight>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}

// -------------------------------------------------------------------------
// Stories (work behind Orbit)
// -------------------------------------------------------------------------

function Stories() {
  return (
    <Section id="work" className="py-20 sm:py-24">
      <Reveal>
        <p className="eyebrow">Stories behind the build</p>
      </Reveal>
      <SplitReveal text="Every demo carries a real project behind it." className="display mt-4 max-w-3xl text-[clamp(36px,5vw,62px)] text-ink text-balance" />
      <Reveal delay={0.1}>
        <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-ink-soft">Orbit grew out of years of building business dashboards and reporting apps. Each project below links to the demo that shows the idea in action.</p>
      </Reveal>
      <div className="mt-12 border-b border-line">
        {STORIES.map((s) => (
          <Reveal key={s.id} y={36}>
            <Spotlight
              as={Link}
              to={`/dashboard?demo=${s.demo}`}
              className="group relative grid gap-5 py-8 transition-[padding,background-color] duration-500 ease-[var(--ease-out)] hover:bg-card/60 md:grid-cols-[70px_1.1fr_1.4fr_210px] md:items-start md:gap-8 md:px-4 md:hover:pl-7"
            >
              <motion.span aria-hidden="true" className="absolute left-0 right-0 top-0 h-px origin-left bg-line-strong" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE_OUT }} />
              <span className="font-mono text-[13px] text-ink-faint transition-colors duration-300 group-hover:text-accent-dark">{s.index}</span>
              <div>
                <h3 className="text-[24px] font-semibold tracking-tight text-ink">{s.title}</h3>
                <p className="mt-1.5 font-mono text-[11.5px] uppercase tracking-wide text-ink-faint">{s.tag}</p>
              </div>
              <div>
                <p className="text-[15px] leading-relaxed text-ink-soft">{s.text}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {s.stack.map((t) => (
                    <li key={t} className="rounded-full border border-line px-3 py-1 text-[12px] text-ink-soft transition-colors duration-300 group-hover:border-line-strong">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13.5px] font-medium text-accent-dark">
                {s.cta} <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Spotlight>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

// -------------------------------------------------------------------------
// FAQ + closing
// -------------------------------------------------------------------------

function FaqItem({ item, open, onToggle, id }) {
  return (
    <RevealItem y={24} scale={1} duration={0.8} className="py-5">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-btn`} onClick={onToggle} className="group flex w-full items-center justify-between gap-6 text-left text-[17px] font-medium text-ink">
          <span className="transition-colors duration-300 group-hover:text-accent-dark">{item.q}</span>
          <motion.span animate={{ rotate: open ? 45 : 0 }} transition={SPRING_SOFT} className="shrink-0 text-ink-faint">
            <Plus size={20} aria-hidden="true" />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }} className="overflow-hidden">
            <p className="max-w-2xl pt-3 text-[15px] leading-relaxed text-ink-soft">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </RevealItem>
  )
}

function Faq() {
  const [open, setOpen] = useState(null)
  return (
    <Section id="faq" className="py-20 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <Reveal>
            <p className="eyebrow">Frequently asked</p>
          </Reveal>
          <SplitReveal text="Common questions." className="display mt-4 text-[clamp(36px,5vw,58px)] text-ink" />
        </div>
        <RevealGroup className="divide-y divide-line border-y border-line" stagger={0.06}>
          {FAQS.map((f, i) => (
            <FaqItem key={f.q} id={`faq-${i}`} item={f} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          ))}
        </RevealGroup>
      </div>
    </Section>
  )
}

function Closing() {
  return (
    <Section className="py-20 sm:py-24">
      <Parallax distance={0} scaleFrom={0.93}>
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card px-6 py-16 sm:px-12">
          <div aria-hidden="true" className="glow-drift pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl" style={{ background: 'color-mix(in srgb, var(--accent) 30%, transparent)' }} />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Reveal>
                <p className="eyebrow">Bring your own</p>
              </Reveal>
              <SplitReveal text="See what your own data is telling you." className="display mt-4 text-[clamp(38px,5.6vw,72px)] text-ink text-balance" />
              <Reveal delay={0.1}>
                <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-soft">Free to try. No account, no credit card — upload a file or open a demo.</p>
              </Reveal>
              <Reveal delay={0.2} className="mt-8 flex items-center gap-4 rounded-2xl border border-line bg-paper/60 p-4">
                <img src={founderPhoto} alt={FOUNDER.name} className="h-14 w-14 rounded-full border border-line object-cover" />
                <div className="min-w-0">
                  <p className="text-[14.5px] font-semibold text-ink">Built by {FOUNDER.name}</p>
                  <p className="text-[12.5px] leading-snug text-ink-faint">{FOUNDER.tagline}</p>
                  <a href={FOUNDER.portfolio} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent-dark hover:underline">
                    View portfolio <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.15} y={36}>
              <UploadPanel id="upload" />
            </Reveal>
          </div>
        </div>
      </Parallax>
    </Section>
  )
}

const TECH = ['React', 'Vite', 'Tailwind CSS', 'Recharts', 'Framer Motion', 'FastAPI', 'Python', 'pandas', 'PostgreSQL', 'Power BI', 'DAX', 'MCP', 'Gemini API']
const FEATURES = ['KPIs & deltas', 'Cross-filtering', 'Trends & heatmaps', 'Data health score', 'Ask in plain English', 'CSV export', 'Dark & light']

export default function Home() {
  useEffect(() => {
    // Start waking the free-tier backend while the visitor reads the page.
    wakeBackend()
  }, [])

  return (
    <>
      <Hero />
      <Marquee items={FEATURES} />
      <Demos />
      <Statement />
      <Process />
      <Capabilities />
      <Marquee items={TECH} className="mt-4" />
      <Stories />
      <Faq />
      <Closing />
    </>
  )
}
