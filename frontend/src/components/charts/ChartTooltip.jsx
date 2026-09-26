export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-card-lg">
      {label && <p className="mb-1 font-medium text-ink">{label}</p>}
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={entry.dataKey || entry.name} className="flex items-center gap-2 text-ink-soft">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color || entry.fill }} />
            <span>{entry.name}:</span>
            <span className="font-medium text-ink">{formatter ? formatter(entry.value, entry) : entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
