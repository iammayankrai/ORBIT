import Container from '../ui/Container.jsx'
import KPICard from '../dashboard/KPICard.jsx'
import HealthCard from './HealthCard.jsx'
import ChartRenderer from './ChartRenderer.jsx'
import InsightsList from './InsightsList.jsx'
import AIChat from '../ai/AIChat.jsx'

export default function ResultsSection({ analysis, datasetSource, onReset }) {
  const { dataset_name, health, kpis, charts, insights } = analysis

  // compute_kpis() and compute_charts() pick their "primary measure" with
  // the same revenue > profit > quantity > cost priority, and kpis[0] is
  // always the row/order count — so kpis[1] and the first ("trend") chart
  // describe the same measure. Used to annotate the trend chart with its
  // real period-over-period change instead of leaving it as a bare chart.
  const primaryKpi = kpis?.[1]

  return (
    <section id="results" className="scroll-mt-20 border-t border-border bg-surface-alt/30 py-10 sm:py-14">
      <Container className="flex flex-col gap-6">
        <HealthCard health={health} datasetName={dataset_name} onReset={onReset} />

        {kpis?.length > 0 && (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
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
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {charts.map((chart, i) => (
              <div key={chart.id} className={chart.type === 'trend' ? 'lg:col-span-2' : ''}>
                <ChartRenderer chart={chart} delay={i * 0.04} annotationKpi={chart.type === 'trend' ? primaryKpi : undefined} />
              </div>
            ))}
          </div>
        )}

        {insights?.length > 0 && (
          <div>
            <h3 className="mb-3 text-base font-semibold tracking-tight text-ink">Key Insights</h3>
            <InsightsList insights={insights} />
          </div>
        )}

        <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <AIChat datasetSource={datasetSource} title="Ask Your Data" />
        </div>
      </Container>
    </section>
  )
}
