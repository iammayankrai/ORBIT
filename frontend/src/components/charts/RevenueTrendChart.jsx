import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { ACCENT, CHART_INK } from '../../utils/chartTheme.js'
import { formatByUnit } from '../../utils/format.js'

export default function RevenueTrendChart({
  data,
  height = 260,
  tickInterval = 3,
  xKey = 'month',
  yKey = 'revenue',
  unit = 'cr',
  name = 'Revenue',
}) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.16} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
            tick={{ fill: CHART_INK.muted, fontSize: 12 }}
            interval={tickInterval}
            minTickGap={20}
          />
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip
            content={<ChartTooltip formatter={(v) => formatByUnit(v, unit)} />}
            cursor={{ stroke: CHART_INK.axis, strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            name={name}
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
