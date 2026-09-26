import { motion } from 'framer-motion'
import { ShieldCheck, TrendingUp } from 'lucide-react'
import { ACCENT, STATUS } from '../../utils/chartTheme.js'

const floatIn = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: (delay = 0) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] } }),
}

const TREND_POINTS = [28, 34, 30, 40, 46, 42, 52, 58, 54, 64, 70, 78]

function trendPath(points, w, h) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i / (points.length - 1)) * w},${h - (p / 100) * h}`).join(' ')
}

function TrendCard() {
  const path = trendPath(TREND_POINTS, 100, 32)
  return (
    <div className="w-[172px] rounded-2xl border border-border bg-white p-3.5 shadow-card-lg">
      <p className="text-[11px] font-medium text-ink-faint">Revenue Trend</p>
      <svg viewBox="0 0 100 32" className="mt-2 h-9 w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="heroTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.18" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L100,32 L0,32 Z`} fill="url(#heroTrendFill)" stroke="none" />
        <path d={path} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="mt-1.5 text-[13px] font-semibold" style={{ color: STATUS.good }}>
        ↑ 14.7% this period
      </p>
    </div>
  )
}

function TopProductsCard() {
  const bars = [100, 82, 68]
  return (
    <div className="w-[184px] rounded-2xl border border-border bg-white p-3.5 shadow-card-lg">
      <p className="text-[11px] font-medium text-ink-faint">Top Products</p>
      <div className="mt-2.5 flex flex-col gap-2">
        {bars.map((v, i) => (
          <div key={i} className="h-2 overflow-hidden rounded-full bg-surface-alt">
            <div className="h-full rounded-full" style={{ width: `${v}%`, background: ACCENT, opacity: 1 - i * 0.22 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function RevenueKpiCard() {
  return (
    <div className="w-[168px] rounded-2xl border border-border bg-white p-3.5 shadow-card-lg">
      <p className="text-[11px] font-medium text-ink-faint">Revenue</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-ink">₹29.7 Cr</p>
      <p className="mt-1 flex items-center gap-1 text-[12px] font-medium" style={{ color: STATUS.good }}>
        <TrendingUp size={12} aria-hidden="true" /> 14.7% vs prior
      </p>
    </div>
  )
}

function DataHealthCard() {
  return (
    <div className="w-[168px] rounded-2xl border border-border bg-white p-3.5 shadow-card-lg">
      <div className="flex items-center gap-1.5">
        <ShieldCheck size={13} style={{ color: STATUS.good }} aria-hidden="true" />
        <p className="text-[11px] font-medium text-ink-faint">Data Health</p>
      </div>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
        92<span className="text-xs font-medium text-ink-faint"> /100</span>
      </p>
      <p className="mt-1 text-[12px] text-ink-faint">12,471 rows analyzed</p>
    </div>
  )
}

// Purely illustrative previews of what the results dashboard produces —
// static, not live data. They fill the wide empty margins beside the
// upload panel on desktop so the hero reads as a dense analytics product
// from the first view instead of one small card in a lot of whitespace.
// Hidden below xl: there isn't reliably enough side margin above that to
// avoid crowding or overlapping the upload panel.
export default function HeroPreviewCards() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden xl:block" aria-hidden="true">
      <motion.div className="absolute left-0 top-2" initial="hidden" animate="show" custom={0.3} variants={floatIn}>
        <TrendCard />
      </motion.div>
      <motion.div className="absolute right-0 top-10" initial="hidden" animate="show" custom={0.42} variants={floatIn}>
        <TopProductsCard />
      </motion.div>
      <motion.div className="absolute bottom-4 left-6" initial="hidden" animate="show" custom={0.54} variants={floatIn}>
        <RevenueKpiCard />
      </motion.div>
      <motion.div className="absolute bottom-10 right-6" initial="hidden" animate="show" custom={0.62} variants={floatIn}>
        <DataHealthCard />
      </motion.div>
    </div>
  )
}
