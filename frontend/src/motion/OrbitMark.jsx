import { useEffect, useRef } from 'react'
import { animate, motion } from 'framer-motion'
import { EASE_IN_OUT, EASE_OUT, SPRING_POP } from './tokens.js'
import { usePrefersReducedMotion } from './hooks.js'

// The Orbit logo, animated: the ring draws itself, the core pops in, and a
// small body travels the ring (dimmer and smaller on the far side, which sells
// the depth). `mode`:
//   'draw'   one pass - used by the intro loader
//   'loop'   endless - used while a dashboard is being built
//   'static' the plain logo
const CX = 32
const CY = 32
const RX = 27
const RY = 12

export default function OrbitMark({ size = 120, mode = 'draw', duration = 1.5, tone = 'default', className = '' }) {
  const ink = tone === 'light' ? '#ffffff' : 'var(--ink)'
  const core = tone === 'light' ? '#ffffff' : 'var(--accent)'
  const dot = useRef(null)
  const reduced = usePrefersReducedMotion()
  const live = mode !== 'static' && !reduced

  useEffect(() => {
    if (!live || !dot.current) return undefined
    const place = (t) => {
      const a = Math.PI + t * Math.PI * 2
      const front = Math.sin(a) > 0
      const el = dot.current
      if (!el) return
      el.setAttribute('cx', (CX + RX * Math.cos(a)).toFixed(2))
      el.setAttribute('cy', (CY + RY * Math.sin(a)).toFixed(2))
      el.setAttribute('r', front ? '2.9' : '2')
      el.setAttribute('opacity', front ? '1' : '0.45')
    }
    const controls =
      mode === 'loop'
        ? animate(0, 1, { duration: 2.4, ease: 'linear', repeat: Infinity, onUpdate: place })
        : animate(0, 1, { duration, ease: EASE_IN_OUT, delay: 0.35, onUpdate: place })
    return () => controls.stop()
  }, [live, mode, duration])

  const drawn = mode === 'draw' && live
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <motion.ellipse
        cx={CX}
        cy={CY}
        rx={RX}
        ry={RY}
        stroke={ink}
        strokeWidth="3.6"
        strokeLinecap="round"
        initial={drawn ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: EASE_OUT }}
      />
      <motion.circle cx={CX} cy={CY} r="7.5" fill={core} initial={drawn ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ ...SPRING_POP, delay: drawn ? 0.3 : 0 }} style={{ transformOrigin: '32px 32px' }} />
      {live && <circle ref={dot} cx={CX - RX} cy={CY} r="2.5" fill={ink} />}
    </svg>
  )
}
