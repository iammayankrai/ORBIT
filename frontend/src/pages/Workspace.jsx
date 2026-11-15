import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LayoutGroup, motion } from 'framer-motion'
import OrbitMark from '../motion/OrbitMark.jsx'
import { EASE_OUT, SPRING_SOFT } from '../motion/tokens.js'
import { AlertTriangle, Check, Layers, LayoutDashboard, LineChart, Loader2, Sparkles, Table2, ShieldCheck, Upload } from 'lucide-react'
import Logo from '../components/layout/Logo.jsx'
import ThemeToggle from '../components/layout/ThemeToggle.jsx'
import Button from '../components/ui/Button.jsx'
import { Select } from '../components/ui/primitives.jsx'
import FilterBar from '../components/workspace/FilterBar.jsx'
import Overview from '../components/workspace/Overview.jsx'
import { AskTab, BreakdownTab, DataTab, QualityTab, TrendsTab } from '../components/workspace/Tabs.jsx'
import { DEMOS, demoById } from '../config/demos.js'
import { countMask, defaultRange, findMeasure, makeMask, pickPrimary, realMeasures } from '../lib/cube.js'
import { fmtInt } from '../lib/fmt.js'
import { useDataset } from '../state/DatasetContext.jsx'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'trends', label: 'Trends', icon: LineChart },
  { id: 'breakdown', label: 'Breakdown', icon: Layers },
  { id: 'data', label: 'Data', icon: Table2 },
  { id: 'quality', label: 'Quality', icon: ShieldCheck },
  { id: 'ask', label: 'Ask AI', icon: Sparkles },
]

const STEPS = ['Uploading your file…', 'Reading the dataset…', 'Detecting columns…', 'Building the dashboard…']

function LoadingScreen({ label }) {
  const [step, setStep] = useState(0)
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900)
    const s = setTimeout(() => setSlow(true), 7000)
    return () => {
      clearInterval(t)
      clearTimeout(s)
    }
  }, [])
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-line bg-card p-8 text-center shadow-card-lg" role="status" aria-live="polite">
        <span className="mx-auto flex h-16 w-16 items-center justify-center">
          <OrbitMark size={64} mode="loop" />
        </span>
        <p className="mt-3 text-[17px] font-semibold text-ink">Building the dashboard</p>
        <p className="mt-1 truncate text-[13px] text-ink-faint">{label}</p>
        <ul className="mx-auto mt-6 flex max-w-[260px] flex-col gap-2.5 text-left">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-2.5 text-[13.5px] transition-opacity ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
              {i < step ? <Check size={15} className="text-positive" aria-hidden="true" /> : i === step ? <Loader2 size={15} className="animate-spin text-accent" aria-hidden="true" /> : <span className="h-[15px] w-[15px]" />}
              <span className={i === step ? 'text-ink' : 'text-ink-soft'}>{s}</span>
            </li>
          ))}
        </ul>
        {slow && <p className="mt-6 rounded-xl bg-card-alt px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft">The free analysis server was asleep and is waking up. This can take up to a minute the first time.</p>}
      </div>
    </div>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-line bg-card p-8 text-center shadow-card-lg" role="alert">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-negative/10 text-negative">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <p className="mt-4 text-[17px] font-semibold text-ink">We couldn’t build that dashboard</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onRetry && <Button onClick={onRetry}>Try again</Button>}
          <Button to="/#upload" variant="secondary">
            Back to upload
          </Button>
        </div>
      </div>
    </div>
  )
}

function TopBar({ label, onFile, demoId, onDemo, cube }) {
  const inputRef = useRef(null)
  return (
    <motion.header className="glass fixed inset-x-0 top-0 z-50 h-14 border-b border-line" initial={{ y: '-100%' }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: EASE_OUT }}>
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="Orbit home" className="shrink-0">
          <Logo />
        </Link>
        <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="eyebrow hidden sm:inline">Dataset</span>
          <span className="min-w-0 truncate rounded-full border border-line bg-card px-3 py-1 text-[12.5px] font-medium text-ink" title={label}>
            {label}
          </span>
          {cube && (
            <span className="hidden text-[12px] text-ink-faint tabular md:inline">
              {fmtInt(cube.totalRows)} rows · {cube.columns.length} columns
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <Select label="Switch demo" value={demoId ?? ''} onChange={onDemo} options={[...(demoId ? [] : [{ value: '', label: 'Your file' }]), ...DEMOS.map((d) => ({ value: d.id, label: d.title }))]} />
          </div>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
            <Upload size={14} aria-hidden="true" /> <span className="hidden sm:inline">Upload</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  )
}

function Dashboard({ analysis, cube, source, label, demoId, onFile, onDemo }) {
  const primary = useMemo(() => pickPrimary(cube), [cube])
  const measures = useMemo(() => realMeasures(cube), [cube])
  const [filters, setFilters] = useState(() => ({ range: defaultRange(cube), dims: {} }))
  const [tab, setTab] = useState('overview')
  const [measureName, setMeasureName] = useState(primary.name)
  const [userGrain, setUserGrain] = useState(null)
  const measure = findMeasure(cube, measureName)
  const rowCount = useMemo(() => countMask(makeMask(cube, filters)), [cube, filters])

  const toggleDim = useCallback((dimName, code) => {
    setFilters((f) => {
      const next = new Set(f.dims[dimName] ?? [])
      if (next.has(code)) next.delete(code)
      else next.add(code)
      const dims = { ...f.dims }
      if (next.size) dims[dimName] = next
      else delete dims[dimName]
      return { ...f, dims }
    })
  }, [])

  useEffect(() => {
    document.title = `${label} — Orbit`
    return () => {
      document.title = 'Orbit — Turn Your Data Into Decisions'
    }
  }, [label])

  const common = { cube, filters, measure, setMeasure: setMeasureName }

  return (
    <>
      <TopBar label={label} cube={cube} demoId={demoId} onDemo={onDemo} onFile={onFile} />
      <div className="pt-14">
        <FilterBar cube={cube} filters={filters} onChange={setFilters} rowCount={rowCount} />
        <div className="mx-auto flex max-w-[1600px] flex-col gap-0 md:flex-row">
          <nav aria-label="Dashboard sections" className="no-scrollbar sticky top-14 z-20 flex gap-1 overflow-x-auto border-b border-line bg-paper px-4 py-2 md:top-[calc(3.5rem+var(--filter-h,3.4rem)+0.5rem)] md:h-fit md:w-52 md:shrink-0 md:flex-col md:self-start md:border-b-0 md:bg-transparent md:px-4 md:py-5 sm:px-6">
            <LayoutGroup id="workspace-tabs">
              {TABS.map((t) => {
                const active = tab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors duration-300 ${active ? 'text-paper' : 'text-ink-soft hover:bg-card hover:text-ink'}`}
                  >
                    {active && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-ink" transition={SPRING_SOFT} />}
                    <t.icon size={16} aria-hidden="true" className="relative" />
                    <span className="relative">{t.label}</span>
                  </button>
                )
              })}
            </LayoutGroup>
            <div className="mt-6 hidden rounded-xl border border-line bg-card p-3 text-[12px] leading-relaxed text-ink-faint md:block">
              <p className="font-medium text-ink">Tip</p>
              <p className="mt-1">Click any bar, slice or KPI to filter the whole dashboard. Switch the measure from the KPI cards.</p>
            </div>
          </nav>
          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 md:pl-2">
            <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }}>
            {tab === 'overview' && <Overview cube={cube} analysis={analysis} filters={filters} measure={measure} primary={primary} measures={measures} setMeasure={setMeasureName} userGrain={userGrain} setUserGrain={setUserGrain} toggleDim={toggleDim} />}
            {tab === 'trends' && <TrendsTab {...common} />}
            {tab === 'breakdown' && <BreakdownTab {...common} />}
            {tab === 'data' && <DataTab cube={cube} filters={filters} label={label} />}
            {tab === 'quality' && <QualityTab cube={cube} analysis={analysis} />}
            {tab === 'ask' && <AskTab cube={cube} source={source} measure={measure} />}
            </motion.div>
          </main>
        </div>
      </div>
    </>
  )
}

export default function Workspace() {
  const { status, analysis, cube, source, label, error, loadSample, loadFile } = useDataset()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const demo = params.get('demo')

  // Opening /dashboard?demo=… (or switching demos) loads that dataset. A
  // direct visit with nothing loaded and no demo goes back to the upload box.
  const loadedDemo = source?.useSample ? source.sampleId : null
  useEffect(() => {
    if (demo && demoById(demo) && status !== 'loading' && !(loadedDemo === demo && status !== 'idle')) {
      loadSample(demo, demoById(demo).title)
    }
  }, [demo]) // eslint-disable-line react-hooks/exhaustive-deps

  const onDemo = useCallback((id) => id && setParams({ demo: id }), [setParams])
  const onFile = useCallback(
    (file) => {
      setParams({}, { replace: true })
      loadFile(file)
    },
    [loadFile, setParams],
  )

  if (status === 'idle' && !demo) return <Navigate to="/#upload" replace />

  const shellLabel = status === 'ready' ? label : demoById(demo)?.title ?? label ?? 'Dataset'
  const demoId = status === 'ready' && source?.useSample ? source.sampleId : demo && demoById(demo) ? demo : null

  return (
    <div className="min-h-svh bg-paper">
      {status === 'ready' && analysis ? (
        <Dashboard key={analysis.dataset_name + (source?.useSample ? source.sampleId : 'file')} analysis={analysis} cube={cube} source={source} label={shellLabel} demoId={demoId} onFile={onFile} onDemo={onDemo} />
      ) : (
        <>
          <TopBar label={shellLabel} cube={null} demoId={demoId} onDemo={onDemo} onFile={onFile} />
          <div className="pt-14">
            {status === 'error' ? (
              <ErrorScreen message={error} onRetry={source ? () => (source.useSample ? loadSample(source.sampleId, shellLabel) : navigate('/#upload')) : null} />
            ) : (
              <LoadingScreen label={shellLabel} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
