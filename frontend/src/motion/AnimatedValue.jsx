import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'
import { fmtValue } from '../lib/fmt.js'
import { usePrefersReducedMotion } from './hooks.js'
import { EASE_OUT } from './tokens.js'

// A number that counts to its value - from zero on first appearance, and from
// wherever it currently is when the value changes (a filter, a new range).
// The text is written straight to the DOM on every frame, so a dashboard of
// eight tickers never triggers a React render while they run.
export default function AnimatedValue({ value, unit, duration = 0.9, className = '' }) {
  const ref = useRef(null)
  const shown = useRef(0)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (reduced || !Number.isFinite(value)) {
      shown.current = Number.isFinite(value) ? value : 0
      el.textContent = fmtValue(value, unit)
      return undefined
    }
    const controls = animate(shown.current, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => {
        shown.current = v
        el.textContent = fmtValue(v, unit)
      },
    })
    return () => controls.stop()
  }, [value, unit, duration, reduced])

  return (
    <span ref={ref} className={`tabular ${className}`}>
      {fmtValue(reduced ? value : 0, unit)}
    </span>
  )
}
