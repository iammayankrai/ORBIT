import ChartCard from '../charts/ChartCard.jsx'
import RevenueTrendChart from '../charts/RevenueTrendChart.jsx'
import RankedBarChart from '../charts/RankedBarChart.jsx'
import CategoryDonut from '../charts/CategoryDonut.jsx'
import DeltaBadge from '../ui/DeltaBadge.jsx'
import { formatByUnit } from '../../utils/format.js'

function chartSubtitle(chart) {
  if (chart.type === 'trend') return 'Trend over the full date range'
  if (chart.id?.startsWith('margin_by')) return 'Profit margin comparison'
  if (chart.id?.startsWith('top_')) return 'Ranked highest to lowest'
  if (chart.type === 'donut') return 'Share of total'
  if (chart.type === 'bar-horizontal') return 'Ranked highest to lowest'
  return undefined
}

// Backend picks the chart type per detected column combination (trend /
// bar-horizontal / donut) — this just maps that type to the primitive that
// already knows how to render it, adds a subtitle, and (for the trend
// chart) a real period-over-period annotation via `annotationKpi`.
export default function ChartRenderer({ chart, delay = 0, annotationKpi }) {
  const formatter = (v) => formatByUnit(v, chart.unit || 'number')
  const showAnnotation = chart.type === 'trend' && annotationKpi?.change_pct !== null && annotationKpi?.change_pct !== undefined

  return (
    <ChartCard title={chart.title} description={chartSubtitle(chart)} delay={delay}>
      {chart.type === 'trend' && (
        <RevenueTrendChart data={chart.data} xKey={chart.xKey} yKey={chart.yKey} unit={chart.unit} height={220} />
      )}
      {chart.type === 'donut' && (
        <CategoryDonut data={chart.data} nameKey={chart.nameKey} valueKey={chart.valueKey} unit={chart.unit} height={200} />
      )}
      {chart.type === 'bar-horizontal' && (
        <RankedBarChart data={chart.data} nameKey={chart.nameKey} valueKey={chart.valueKey} formatter={formatter} />
      )}
      {showAnnotation && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <DeltaBadge value={annotationKpi.change_pct} goodDirection={annotationKpi.good_direction} />
          <span className="text-xs text-ink-faint">compared with the prior period</span>
        </div>
      )}
    </ChartCard>
  )
}
