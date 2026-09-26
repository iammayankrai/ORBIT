import RevealOnScroll from '../ui/RevealOnScroll.jsx'

export default function ChartCard({ title, description, action, children, delay = 0, className = '' }) {
  return (
    <RevealOnScroll delay={delay} className={`rounded-2xl border border-border bg-white p-4 sm:p-5 ${className}`}>
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-ink-faint">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </RevealOnScroll>
  )
}
