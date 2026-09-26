import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { ACCENT, CHART_INK, STATUS } from '../../utils/chartTheme.js'

// "Compare magnitude, low -> high": single accent hue by default. Pass
// `colorBySign` when the value's direction (not just magnitude) is the story.
export default function RankedBarChart({
  data,
  nameKey = 'name',
  valueKey = 'value',
  suffix = '',
  colorBySign = false,
  height,
  formatter,
}) {
  const rowHeight = 40
  const chartHeight = height || data.length * rowHeight + 16

  return (
    <div style={{ width: '100%', height: chartHeight }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, left: 0, bottom: 4 }} barCategoryGap={12}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey={nameKey}
            tickLine={false}
            axisLine={false}
            width={150}
            tick={{ fill: CHART_INK.primary, fontSize: 13 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(11,13,18,0.03)' }}
            content={<ChartTooltip formatter={(v) => (formatter ? formatter(v) : `${v}${suffix}`)} />}
          />
          <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((row, i) => (
              <Cell key={`${row[nameKey]}-${i}`} fill={colorBySign ? (row[valueKey] < 0 ? STATUS.critical : STATUS.good) : ACCENT} />
            ))}
            <LabelList
              dataKey={valueKey}
              position="right"
              formatter={(v) => (formatter ? formatter(v) : `${v}${suffix}`)}
              style={{ fill: CHART_INK.primary, fontSize: 12, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
