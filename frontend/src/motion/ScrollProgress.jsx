import { motion, useScroll, useSpring } from 'framer-motion'
import { usePrefersReducedMotion } from './hooks.js'

// Hairline reading-progress bar along the top edge of the viewport.
export default function ScrollProgress() {
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 28, restDelta: 0.0005 })
  if (reduced) return null
  return <motion.div aria-hidden="true" style={{ scaleX }} className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-accent" />
}
