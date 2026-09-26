import { motion } from 'framer-motion'
import { KPIS, MONTHLY_REVENUE } from '../../data/businessData.js'
import KPICard from '../dashboard/KPICard.jsx'
import RevenueTrendChart from '../charts/RevenueTrendChart.jsx'
import HeroAIPanel from './HeroAIPanel.jsx'

const SPARKLINES = {
  revenue: MONTHLY_REVENUE.slice(-8).map((m) => m.revenue),
  orders: MONTHLY_REVENUE.slice(-8).map((m) => m.orders),
  margin: MONTHLY_REVENUE.slice(-8).map((m) => m.margin),
}

export default function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-6xl overflow-hidden rounded-[28px] border border-border bg-white shadow-card-lg"
    >
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>
        <span className="mx-auto text-xs font-medium text-ink-faint sm:mx-0">Orbit — Business Overview</span>
        <span className="ml-auto hidden rounded-full bg-surface-alt px-2.5 py-1 text-[11px] font-medium text-ink-faint sm:inline-block">
          Synthetic demo data
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px]">
        <div className="p-5 sm:p-7">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <KPICard label="Revenue" value={KPIS.revenue.value} unit="cr" deltaPct={KPIS.revenue.deltaPct} sparkline={SPARKLINES.revenue} reveal={false} />
            <KPICard label="Orders" value={KPIS.orders.value} unit="count" deltaPct={KPIS.orders.deltaPct} sparkline={SPARKLINES.orders} reveal={false} />
            <KPICard label="Margin" value={KPIS.margin.value} unit="pct" deltaPct={KPIS.margin.deltaPct} sparkline={SPARKLINES.margin} reveal={false} />
            <KPICard label="Inventory" value={KPIS.inventory.value} unit="cr" deltaPct={KPIS.inventory.deltaPct} goodDirection="down" reveal={false} />
          </div>
          <div className="mt-6">
            <p className="mb-1 text-sm font-medium text-ink">Revenue trend</p>
            <RevenueTrendChart data={MONTHLY_REVENUE.slice(-12)} height={180} />
          </div>
        </div>

        <div className="border-t border-border bg-surface-alt/50 p-5 sm:p-7 lg:border-l lg:border-t-0">
          <HeroAIPanel />
        </div>
      </div>
    </motion.div>
  )
}
