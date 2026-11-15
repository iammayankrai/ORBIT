import { useEffect, useRef } from 'react'
import { animate, motion } from 'framer-motion'
import { useMotionPhase } from './MotionProvider.jsx'
import OrbitMark from './OrbitMark.jsx'
import { EASE_IN_OUT, EASE_OUT } from './tokens.js'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Opening sequence: the logo draws itself while a counter runs, then the
// whole layer wipes upward and the hero starts entering underneath it.
// Purely cosmetic - the page is already loaded behind it - so it is short,
// plays once per session, and never delays a direct link to the dashboard.
export default function Intro() {
  const { phase, setPhase } = useMotionPhase()
  const counter = useRef(null)

  useEffect(() => {
    if (phase !== 'playing') return undefined
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    let cancelled = false

    const count = animate(0, 100, {
      duration: 1.7,
      ease: EASE_OUT,
      onUpdate: (v) => {
        if (counter.current) counter.current.textContent = String(Math.round(v)).padStart(3, '0')
      },
    })
    // Hold until the web fonts are in (so the hero doesn't flash a fallback
    // face as it appears), but never longer than a couple of seconds.
    const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(2400)])
    Promise.all([fonts, wait(1800)]).then(() => {
      if (!cancelled) setPhase('revealing')
    })

    return () => {
      cancelled = true
      count.stop()
      root.style.overflow = previous
    }
  }, [phase, setPhase])

  if (phase === 'done') return null
  const leaving = phase === 'revealing'

  return (
    <motion.div
      role="status"
      aria-label="Loading Orbit"
      className={`fixed inset-0 z-[100] bg-paper text-ink ${leaving ? 'pointer-events-none' : ''}`}
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      animate={{ clipPath: leaving ? 'inset(0 0 100% 0)' : 'inset(0 0 0% 0)' }}
      transition={{ duration: 0.9, ease: EASE_IN_OUT }}
      onAnimationComplete={() => leaving && setPhase('done')}
    >
      <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-5" animate={{ y: leaving ? -50 : 0, opacity: leaving ? 0 : 1 }} transition={{ duration: 0.55, ease: EASE_OUT }}>
        <OrbitMark size={132} mode="draw" />
        <span className="block overflow-hidden">
          <motion.span className="block text-[30px] font-semibold tracking-tight" initial={{ y: '115%' }} animate={{ y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: EASE_OUT }}>
            Orbit
          </motion.span>
        </span>
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 font-mono text-[11.5px] uppercase tracking-[0.14em] text-ink-faint sm:p-10">
        <span>
          <span ref={counter}>000</span>%
        </span>
        <span className="hidden sm:inline">Turn your data into decisions</span>
      </div>
    </motion.div>
  )
}
