import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useFinePointer, usePrefersReducedMotion } from './hooks.js'

// A button wrapper that leans toward the cursor and springs back on leave.
// Mouse pointers only; touch and reduced-motion get the plain element.
export default function Magnetic({ children, strength = 0.28, max = 14, className = '' }) {
  const ref = useRef(null)
  const fine = useFinePointer()
  const reduced = usePrefersReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 })

  if (!fine || reduced) return <span className={`inline-flex ${className}`}>{children}</span>

  const clamp = (v) => Math.max(-max, Math.min(max, v))
  function move(e) {
    const r = ref.current.getBoundingClientRect()
    x.set(clamp((e.clientX - (r.left + r.width / 2)) * strength))
    y.set(clamp((e.clientY - (r.top + r.height / 2)) * strength))
  }
  function leave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span ref={ref} onPointerMove={move} onPointerLeave={leave} style={{ x: sx, y: sy }} className={`inline-flex ${className}`}>
      {children}
    </motion.span>
  )
}
