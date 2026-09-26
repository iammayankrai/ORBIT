import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { CHART_INK, SEQUENTIAL_BLUE } from '../../utils/chartTheme.js'
import { inr } from '../../utils/format.js'

// Ordinal sequential ramp: increasing age = darker step of the same hue.
export default function AgeingColumns({ data, nameKey = 'bucket', valueKey = 'value', height = 240 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }} barCategoryGap={24}>
          <XAxis dataKey={nameKey} tickLine={false} axisLine={{ stroke: CHART_INK.grid }} tick={{ fill: CHART_INK.muted, fontSize: 12 }} />
          <YAxis hide />
          <Tooltip cursor={{ fill: 'rgba(11,13,18,0.03)' }} content={<ChartTooltip formatter={(v) => inr(v)} />} />
          <Bar dataKey={valueKey} radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((row, i) => (
              <Cell key={row[nameKey]} fill={SEQUENTIAL_BLUE[i % SEQUENTIAL_BLUE.length]} />
            ))}
            <LabelList dataKey={valueKey} position="top" formatter={(v) => inr(v)} style={{ fill: CHART_INK.primary, fontSize: 12, fontWeight: 500 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
