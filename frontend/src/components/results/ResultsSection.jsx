import { RotateCcw } from 'lucide-react'
import Container from '../ui/Container.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import Button from '../ui/Button.jsx'
import KPICard from '../dashboard/KPICard.jsx'
import HealthCard from './HealthCard.jsx'
import ChartRenderer from './ChartRenderer.jsx'
import InsightsList from './InsightsList.jsx'
import AIChat from '../ai/AIChat.jsx'

export default function ResultsSection({ analysis, datasetSource, onReset }) {
  const { dataset_name, health, kpis, charts, insights } = analysis

  return (
    <section id="results" className="scroll-mt-20 border-t border-border bg-surface-alt/30 py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <div className="flex flex-col items-center gap-5 text-center">
          <SectionHeader eyebrow="Results" title="Here's what your data is telling you." />
          <Button as="button" type="button" variant="secondary" size="md" onClick={onReset}>
            <RotateCcw size={15} aria-hidden="true" /> Analyse a different file
          </Button>
        </div>

        <HealthCard health={health} datasetName={dataset_name} />

        {kpis?.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kpis.map((kpi) => (
              <KPICard
                key={kpi.id}
                label={kpi.label}
                value={kpi.raw_value}
                unit={kpi.unit}
                deltaPct={kpi.change_pct}
                goodDirection={kpi.good_direction}
              />
            ))}
          </div>
        )}

        {charts?.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {charts.map((chart, i) => (
              <div key={chart.id} className={chart.type === 'trend' ? 'lg:col-span-2' : ''}>
                <ChartRenderer chart={chart} delay={i * 0.05} />
              </div>
            ))}
          </div>
        )}

        {insights?.length > 0 && (
          <div>
            <h3 className="mb-5 text-xl font-semibold tracking-tight text-ink">What your data is telling you</h3>
            <InsightsList insights={insights} />
          </div>
        )}

        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
          <AIChat datasetSource={datasetSource} title="Ask Your Data" />
        </div>
      </Container>
    </section>
  )
}
