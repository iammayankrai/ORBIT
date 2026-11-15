import { useEffect } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'
import { useFinePointer, usePrefersReducedMotion } from './hooks.js'

// Tracks the pointer inside `ref` as two smoothed values from -0.5 to 0.5
// (0 at the centre). Layers multiply these by different amounts to get a
// cheap parallax depth. A no-op for touch and reduced-motion users.
export default function usePointerDepth(ref) {
  const fine = useFinePointer()
  const reduced = usePrefersReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useEffect(() => {
    const el = ref.current
    if (!el || !fine || reduced) return undefined
    const move = (e) => {
      const r = el.getBoundingClientRect()
      x.set((e.clientX - r.left) / r.width - 0.5)
      y.set((e.clientY - r.top) / r.height - 0.5)
    }
    const leave = () => {
      x.set(0)
      y.set(0)
    }
    el.addEventListener('pointermove', move, { passive: true })
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [ref, fine, reduced, x, y])

  return { x: useSpring(x, { stiffness: 70, damping: 16, mass: 0.7 }), y: useSpring(y, { stiffness: 70, damping: 16, mass: 0.7 }) }
}
