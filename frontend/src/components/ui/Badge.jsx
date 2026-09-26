const TONES = {
  neutral: 'bg-surface-alt text-ink-soft',
  accent: 'bg-accent-soft text-accent-dark',
  positive: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  negative: 'bg-red-50 text-red-700',
}

export default function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}
