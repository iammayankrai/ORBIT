import { INVENTORY, KPIS, MONTHLY_REVENUE, REGIONS, TOP_PRODUCTS } from '../../data/businessData.js'
import Container from '../ui/Container.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import KPICard from '../dashboard/KPICard.jsx'
import ChartCard from '../charts/ChartCard.jsx'
import RevenueTrendChart from '../charts/RevenueTrendChart.jsx'
import DumbbellChart from '../charts/DumbbellChart.jsx'
import RankedBarChart from '../charts/RankedBarChart.jsx'
import AgeingColumns from '../charts/AgeingColumns.jsx'
import TargetMeterList from '../charts/TargetMeterList.jsx'
import { pct } from '../../utils/format.js'

const topByRevenue = [...TOP_PRODUCTS].sort((a, b) => b.revenue - a.revenue).slice(0, 6).map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) }))

export default function ProductShowcase() {
  return (
    <section id="product" className="py-24 sm:py-32">
      <Container>
        <SectionHeader
          eyebrow="Product"
          title="Understand your business at a glance."
          description="Every number below comes from the same synthetic dataset the AI Analyst reasons over — nothing here is a mockup."
        />

        <div className="mt-16 rounded-[28px] border border-border bg-surface-alt/40 p-4 sm:p-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <KPICard label="Revenue" value={KPIS.revenue.value} unit="cr" deltaPct={KPIS.revenue.deltaPct} />
            <KPICard label="Orders" value={KPIS.orders.value} unit="count" deltaPct={KPIS.orders.deltaPct} delay={0.05} />
            <KPICard label="Gross Margin" value={KPIS.margin.value} unit="pct" deltaPct={KPIS.margin.deltaPct} delay={0.1} />
            <KPICard label="Inventory" value={KPIS.inventory.value} unit="cr" deltaPct={KPIS.inventory.deltaPct} goodDirection="down" delay={0.15} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue trend" description="Last 12 months">
              <RevenueTrendChart data={MONTHLY_REVENUE.slice(-12)} />
            </ChartCard>
            <ChartCard title="Regional performance" description="June vs July">
              <DumbbellChart data={REGIONS} />
            </ChartCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Top products" description="By revenue this month, ₹ L">
              <RankedBarChart data={topByRevenue} nameKey="name" valueKey="revenue" formatter={(v) => `₹${(v / 100).toFixed(2)} Cr`} />
            </ChartCard>
            <ChartCard title="Inventory ageing" description="Value by age bucket">
              <AgeingColumns data={INVENTORY.ageingBuckets} />
            </ChartCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr]">
            <ChartCard title="Target vs actual" description={`Company-wide attainment: ${pct((REGIONS.reduce((s, r) => s + r.july, 0) / REGIONS.reduce((s, r) => s + r.target, 0)) * 100, { decimals: 0 })}`}>
              <TargetMeterList data={REGIONS} />
            </ChartCard>
          </div>
        </div>
      </Container>
    </section>
  )
}
