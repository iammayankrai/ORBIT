import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { usePrefersReducedMotion } from './hooks.js'

// Scroll-linked drift (and optional scale). `distance` is px of travel in each
// direction while the element crosses the viewport; the animation is scrubbed
// by scroll position, so it is always exactly as fast as the user scrolls.
export default function Parallax({ children, distance = 40, scaleFrom, scaleTo = 1, className = '', as = 'div' }) {
  const ref = useRef(null)
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  const scale = useTransform(scrollYProgress, [0, 0.45], [scaleFrom ?? 1, scaleTo])
  const Tag = reduced ? as : motion[as]

  if (reduced) return <Tag className={className}>{children}</Tag>
  return (
    <Tag ref={ref} className={className} style={{ y, scale: scaleFrom ? scale : undefined }}>
      {children}
    </Tag>
  )
}
