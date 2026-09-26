import { TriangleAlert } from 'lucide-react'
import { INVENTORY } from '../../data/businessData.js'
import Container from '../ui/Container.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import KPICard from '../dashboard/KPICard.jsx'
import ChartCard from '../charts/ChartCard.jsx'
import AgeingColumns from '../charts/AgeingColumns.jsx'
import CategoryDonut from '../charts/CategoryDonut.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'
import Badge from '../ui/Badge.jsx'
import { inr } from '../../utils/format.js'

const RISK_TONE = { High: 'negative', Medium: 'warning', Low: 'neutral' }

export default function InventoryIntelligence() {
  return (
    <section id="inventory" className="py-24 sm:py-32">
      <Container>
        <SectionHeader
          eyebrow="Inventory Intelligence"
          title="Know what to stock. And what not to."
          description="Every SKU, ranked by how much capital it's tying up and how long it's been sitting there."
        />

        <div className="mt-16 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <KPICard label="Inventory Value" value={INVENTORY.totalValue} unit="cr" deltaPct={3.1} goodDirection="down" />
          <KPICard label="Slow Moving" value={INVENTORY.slowMoving} unit="cr" deltaPct={4.6} goodDirection="down" delay={0.05} />
          <KPICard label="Ageing > 90 Days" value={INVENTORY.ageing90} unit="cr" deltaPct={8.2} goodDirection="down" delay={0.1} />
          <KPICard label="Stock Risk" value={INVENTORY.riskSkuCount} unit="count" deltaPct={5.9} goodDirection="down" delay={0.15} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Inventory ageing" description="Value by age bucket">
            <AgeingColumns data={INVENTORY.ageingBuckets} />
          </ChartCard>
          <ChartCard title="Stock by category" description="Share of inventory value">
            <CategoryDonut data={INVENTORY.byCategory} />
          </ChartCard>
        </div>

        <RevealOnScroll delay={0.1} className="mt-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h3 className="mb-4 text-base font-semibold text-ink">Inventory risk table</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
                  <th className="py-2 pr-4 font-medium">SKU</th>
                  <th className="py-2 pr-4 font-medium">Region</th>
                  <th className="py-2 pr-4 font-medium">Ageing</th>
                  <th className="py-2 pr-4 font-medium">Value</th>
                  <th className="py-2 pr-4 font-medium">Risk</th>
                  <th className="py-2 font-medium">Recommended action</th>
                </tr>
              </thead>
              <tbody>
                {INVENTORY.riskTable.map((row) => (
                  <tr key={row.sku} className="border-b border-border-soft last:border-0">
                    <td className="py-3 pr-4 font-medium text-ink">{row.name}</td>
                    <td className="py-3 pr-4 text-ink-soft">{row.region}</td>
                    <td className="py-3 pr-4 text-ink-soft">{row.daysAgeing} days</td>
                    <td className="py-3 pr-4 text-ink-soft">{inr(row.value)}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={RISK_TONE[row.risk]}>{row.risk}</Badge>
                    </td>
                    <td className="py-3 text-ink-soft">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15} className="mt-4 flex gap-3 rounded-2xl bg-accent-soft px-5 py-4">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-accent-dark" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink">
            <span className="font-semibold">{INVENTORY.riskSkuCount} SKUs</span> are showing elevated inventory risk. 7 of
            them account for <span className="font-semibold">62%</span> of ageing inventory value.
          </p>
        </RevealOnScroll>
      </Container>
    </section>
  )
}
