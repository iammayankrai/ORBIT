import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

export function useCountUp(target, { duration = 900, decimals = 1 } = {}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setValue(target)
      return
    }
    let start = null
    const from = 0
    function tick(now) {
      if (start === null) start = now
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    const frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target])

  return { ref, value: Number(value.toFixed(decimals)) }
}
