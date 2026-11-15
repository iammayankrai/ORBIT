import { useRef } from 'react'
import { useInView } from 'framer-motion'

// Endless ticker. It pauses itself while off-screen (and on hover), so it
// costs nothing when nobody can see it. Reduced motion stops it in CSS.
export default function Marquee({ items, className = '' }) {
  const ref = useRef(null)
  const visible = useInView(ref, { margin: '120px' })
  const row = [...items, ...items]
  return (
    <div ref={ref} className={`marquee overflow-hidden border-y border-line py-4 ${className}`} data-off={!visible} aria-hidden="true">
      <div className="marquee__track flex w-max animate-marquee items-center gap-10">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap font-mono text-[12.5px] uppercase tracking-[0.12em] text-ink-faint">
            {t}
            <span className="h-1 w-1 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  )
}
