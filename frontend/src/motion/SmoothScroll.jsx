import { useEffect } from 'react'
import Lenis from 'lenis'
import { useMotionPhase } from './MotionProvider.jsx'
import { setLenis } from './scroll.js'
import { usePrefersReducedMotion } from './hooks.js'

// Inertial smooth-scroll for the marketing page only. The dashboard keeps
// native scrolling: it is full of nested scroll areas (tables, popovers,
// the insights rail) where momentum scrolling gets in the way.
export default function SmoothScroll({ pathname }) {
  const { introDone } = useMotionPhase()
  const reduced = usePrefersReducedMotion()
  const enabled = pathname === '/' && introDone && !reduced

  useEffect(() => {
    if (!enabled) return undefined
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: true })
    setLenis(lenis)
    return () => {
      setLenis(null)
      lenis.destroy()
    }
  }, [enabled])

  return null
}
