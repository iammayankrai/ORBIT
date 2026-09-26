import ChartCard from '../charts/ChartCard.jsx'
import RevenueTrendChart from '../charts/RevenueTrendChart.jsx'
import RankedBarChart from '../charts/RankedBarChart.jsx'
import CategoryDonut from '../charts/CategoryDonut.jsx'
import { formatByUnit } from '../../utils/format.js'

// Backend picks the chart type per detected column combination (trend /
// bar-horizontal / donut) — this just maps that type to the primitive that
// already knows how to render it.
export default function ChartRenderer({ chart, delay = 0 }) {
  const formatter = (v) => formatByUnit(v, chart.unit || 'number')

  return (
    <ChartCard title={chart.title} delay={delay}>
      {chart.type === 'trend' && (
        <RevenueTrendChart data={chart.data} xKey={chart.xKey} yKey={chart.yKey} unit={chart.unit} height={240} />
      )}
      {chart.type === 'donut' && (
        <CategoryDonut data={chart.data} nameKey={chart.nameKey} valueKey={chart.valueKey} unit={chart.unit} height={220} />
      )}
      {chart.type === 'bar-horizontal' && (
        <RankedBarChart data={chart.data} nameKey={chart.nameKey} valueKey={chart.valueKey} formatter={formatter} />
      )}
    </ChartCard>
  )
}
