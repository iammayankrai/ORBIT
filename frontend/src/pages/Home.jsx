import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Filter, GitCompare, Grid3x3, Plus, ShieldCheck, Sparkles, Table2 } from 'lucide-react'
import { DashboardPreview, DemoArt } from '../components/home/art.jsx'
import UploadPanel from '../components/home/UploadPanel.jsx'
import Button from '../components/ui/Button.jsx'
import RevealOnScroll from '../components/ui/RevealOnScroll.jsx'
import { FOUNDER } from '../config/brand.js'
import { DEMOS, FAQS, STORIES } from '../config/demos.js'
import founderPhoto from '../assets/mayank-rai.jpg'
import { wakeBackend } from '../services/dataService.js'

const Section = ({ id, className = '', children }) => (
  <section id={id} className={`scroll-mt-20 ${className}`}>
    <div className="mx-auto max-w-7xl px-5 sm:px-8">{children}</div>
  </section>
)

// -------------------------------------------------------------------------
// Hero
// -------------------------------------------------------------------------

function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-28 sm:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[620px]" style={{ background: 'radial-gradient(60% 55% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)' }} />
      <div className="relative mx-auto max-w-7xl px-5 text-center sm:px-8">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-[12.5px] font-medium text-ink-soft">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-positive" /> Live demos · no sign-up
        </p>
        <h1 className="display mx-auto mt-7 max-w-4xl text-[clamp(46px,8.4vw,108px)] text-ink text-balance">
          Turn your data
          <br />
          into decisions.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft sm:text-[18px]">
          Drop in any Excel or CSV and get a full interactive dashboard in seconds — KPIs, trends, breakdowns, data quality and plain-English answers.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button to="/#upload" size="lg">
            Upload your data <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <Button to="/#demos" size="lg" variant="secondary">
            Explore live demos
          </Button>
        </div>

        {/* floating dashboard cards */}
        <div className="relative mx-auto mt-16 h-[330px] max-w-5xl sm:h-[430px]" aria-hidden="true">
          <div className="absolute left-[2%] top-10 hidden w-[44%] -rotate-6 animate-float opacity-90 sm:block" style={{ animationDelay: '-2s' }}>
            <DashboardPreview variant="b" />
          </div>
          <div className="absolute right-[2%] top-14 hidden w-[44%] rotate-6 animate-float opacity-90 sm:block" style={{ animationDelay: '-4s' }}>
            <DashboardPreview variant="c" />
          </div>
          <div className="absolute inset-x-0 top-0 mx-auto w-[92%] animate-float sm:w-[62%]">
            <DashboardPreview variant="a" />
          </div>
          <span className="absolute left-[6%] top-2 rotate-[-8deg] rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-lift sm:left-[14%]">KPIs &amp; deltas</span>
          <span className="absolute right-[4%] top-24 rotate-[7deg] rounded-full bg-lilac px-3.5 py-1.5 text-[12.5px] font-semibold text-ink shadow-lift sm:right-[10%]">Ask in plain English</span>
          <span className="absolute bottom-6 left-[12%] rotate-[4deg] rounded-full border border-line-strong bg-card px-3.5 py-1.5 text-[12.5px] font-semibold text-ink shadow-lift">Cross-filtering</span>
        </div>
      </div>
    </section>
  )
}

// -------------------------------------------------------------------------
// Marquee
// -------------------------------------------------------------------------

function Marquee({ items, className = '' }) {
  const row = [...items, ...items]
  return (
    <div className={`overflow-hidden border-y border-line py-4 ${className}`} aria-hidden="true">
      <div className="flex w-max animate-marquee items-center gap-10">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap font-mono text-[12.5px] uppercase tracking-[0.12em] text-ink-faint">
            {t}
            <span className="h-1 w-1 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Demos
// -------------------------------------------------------------------------

function DemoCard({ demo, index }) {
  return (
    <RevealOnScroll delay={(index % 3) * 0.06}>
      <Link
        to={`/dashboard?demo=${demo.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
      >
        <div className="aspect-[16/10] overflow-hidden border-b border-line">
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
            <DemoArt kind={demo.kind} color={demo.color} />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow">{demo.domain}</span>
            <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent-dark">
              Live Demo <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
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
      </Link>
    </RevealOnScroll>
  )
}

function Demos() {
  return (
    <Section id="demos" className="py-20 sm:py-28">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Demos</p>
          <h2 className="display mt-4 max-w-2xl text-[clamp(36px,5.4vw,68px)] text-ink text-balance">
            Explore, filter &amp; experience live dashboards.
          </h2>
        </div>
        <div className="max-w-sm">
          <p className="text-[15.5px] leading-relaxed text-ink-soft">Six working dashboards on synthetic data — each one a full workspace you can slice, compare and question. Or bring your own file.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button to="/#upload" size="sm">
              Upload your data
            </Button>
            <Button to="/#process" size="sm" variant="secondary">
              How it works
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DEMOS.map((d, i) => (
          <DemoCard key={d.id} demo={d} index={i} />
        ))}
      </div>
    </Section>
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

function Terminal() {
  const lines = [
    ['$', 'orbit analyze Sales_Data_Demo.xlsx', 'text-ink'],
    ['✓', 'read 12,471 rows · 14 columns', 'text-positive'],
    ['✓', 'date: Date · 5 measures · 7 dimensions', 'text-positive'],
    ['✓', 'data health 92 / 100 · 21 anomalies flagged', 'text-positive'],
    ['→', 'building cube in your browser…', 'text-warning'],
    ['✓', 'dashboard ready — filters run locally, instantly', 'text-positive'],
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-[#0b0a09] shadow-lift" aria-hidden="true">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[11.5px] text-white/40">orbit — analysis</span>
      </div>
      <div className="flex flex-col gap-2.5 p-5 font-mono text-[13px] leading-relaxed">
        {lines.map(([sym, text, cls], i) => (
          <p key={i} className="flex gap-3 text-[#f5f2eb]">
            <span className={sym === '$' ? 'text-white/40' : cls.replace('text-ink', 'text-white/40')}>{sym}</span>
            <span className={sym === '$' ? 'text-[#f5f2eb]' : 'text-white/75'}>{text}</span>
          </p>
        ))}
        <p className="flex gap-3 text-white/40">
          <span>$</span>
          <span className="inline-block h-4 w-2 animate-pulse bg-white/60" />
        </p>
      </div>
    </div>
  )
}

function Process() {
  return (
    <Section id="process" className="py-20 sm:py-24">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p className="eyebrow">Behind the build</p>
          <h2 className="display mt-4 text-[clamp(36px,5vw,62px)] text-ink text-balance">From spreadsheet to answer in four steps.</h2>
          <ol className="mt-10 flex flex-col">
            {STEPS.map((s) => (
              <li key={s.n} className="grid grid-cols-[48px_1fr] gap-4 border-t border-line py-5">
                <span className="font-mono text-[13px] text-accent-dark">{s.n}</span>
                <div>
                  <h3 className="text-[18px] font-semibold tracking-tight text-ink">{s.t}</h3>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <RevealOnScroll>
          <Terminal />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[['React', 'in-browser cube'], ['FastAPI', 'schema detection'], ['pandas', 'the numbers']].map(([a, b]) => (
              <div key={a} className="rounded-xl border border-line bg-card px-3 py-3">
                <p className="text-[14px] font-semibold text-ink">{a}</p>
                <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wide text-ink-faint">{b}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
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
      <p className="eyebrow">Capabilities</p>
      <h2 className="display mt-4 max-w-3xl text-[clamp(36px,5vw,62px)] text-ink text-balance">A real workspace, not a screenshot of one.</h2>
      <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {CAPS.map((c) => (
          <div key={c.t} className="bg-card p-7">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
              <c.icon size={19} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-ink">{c.t}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{c.d}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// -------------------------------------------------------------------------
// Stories (work behind Orbit)
// -------------------------------------------------------------------------

function Stories() {
  return (
    <Section id="work" className="py-20 sm:py-24">
      <p className="eyebrow">Stories behind the build</p>
      <h2 className="display mt-4 max-w-3xl text-[clamp(36px,5vw,62px)] text-ink text-balance">Every demo carries a real project behind it.</h2>
      <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-ink-soft">Orbit grew out of years of building business dashboards and reporting apps. Each project below links to the demo that shows the idea in action.</p>
      <div className="mt-12 border-b border-line">
        {STORIES.map((s) => (
          <RevealOnScroll key={s.id}>
            <Link
              to={`/dashboard?demo=${s.demo}`}
              className="group grid gap-5 border-t border-line py-8 transition-colors hover:bg-card/60 md:grid-cols-[70px_1.1fr_1.4fr_210px] md:items-start md:gap-8 md:px-4"
            >
              <span className="font-mono text-[13px] text-ink-faint">{s.index}</span>
              <div>
                <h3 className="text-[24px] font-semibold tracking-tight text-ink">{s.title}</h3>
                <p className="mt-1.5 font-mono text-[11.5px] uppercase tracking-wide text-ink-faint">{s.tag}</p>
              </div>
              <div>
                <p className="text-[15px] leading-relaxed text-ink-soft">{s.text}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {s.stack.map((t) => (
                    <li key={t} className="rounded-full border border-line px-3 py-1 text-[12px] text-ink-soft">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13.5px] font-medium text-accent-dark">
                {s.cta} <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          </RevealOnScroll>
        ))}
      </div>
    </Section>
  )
}

// -------------------------------------------------------------------------
// FAQ + closing
// -------------------------------------------------------------------------

function Faq() {
  return (
    <Section id="faq" className="py-20 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="eyebrow">Frequently asked</p>
          <h2 className="display mt-4 text-[clamp(36px,5vw,58px)] text-ink">Common questions.</h2>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-medium text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus size={20} className="shrink-0 text-ink-faint transition-transform duration-300 group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}

function Closing() {
  return (
    <Section className="py-20 sm:py-24">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card px-6 py-16 sm:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl" style={{ background: 'color-mix(in srgb, var(--accent) 30%, transparent)' }} />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow">Bring your own</p>
            <h2 className="display mt-4 text-[clamp(38px,5.6vw,72px)] text-ink text-balance">See what your own data is telling you.</h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-soft">Free to try. No account, no credit card — upload a file or open a demo.</p>
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-line bg-paper/60 p-4">
              <img src={founderPhoto} alt={FOUNDER.name} className="h-14 w-14 rounded-full border border-line object-cover" />
              <div className="min-w-0">
                <p className="text-[14.5px] font-semibold text-ink">Built by {FOUNDER.name}</p>
                <p className="text-[12.5px] leading-snug text-ink-faint">{FOUNDER.tagline}</p>
                <a href={FOUNDER.portfolio} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent-dark hover:underline">
                  View portfolio <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
          <UploadPanel id="upload" />
        </div>
      </div>
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
      <Process />
      <Capabilities />
      <Marquee items={TECH} className="mt-4" />
      <Stories />
      <Faq />
      <Closing />
    </>
  )
}
