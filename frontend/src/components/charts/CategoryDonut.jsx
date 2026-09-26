import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { CATEGORICAL } from '../../utils/chartTheme.js'
import { inr } from '../../utils/format.js'

export default function CategoryDonut({ data, nameKey = 'name', valueKey = 'value', height = 260 }) {
  const total = data.reduce((sum, d) => sum + d[valueKey], 0)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div style={{ width: height, height }} className="shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="#fff" strokeWidth={2}>
              {data.map((row, i) => (
                <Cell key={row[nameKey]} fill={CATEGORICAL[i % CATEGORICAL.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatter={(v) => inr(v)} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex w-full flex-col gap-2.5">
        {data.map((row, i) => (
          <li key={row[nameKey]} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-ink-soft">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CATEGORICAL[i % CATEGORICAL.length] }} />
              {row[nameKey]}
            </span>
            <span className="font-medium text-ink">
              {inr(row[valueKey])} <span className="text-ink-faint">· {Math.round((row[valueKey] / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
