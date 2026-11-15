import { motion, useTransform } from 'framer-motion'
import { DashboardPreview } from './art.jsx'
import { usePrefersReducedMotion } from '../../motion/hooks.js'
import { EASE_OUT, SPRING_POP } from '../../motion/tokens.js'

// The hero's floating dashboards. On entry the side cards start stacked behind
// the centre one and fan out to either side (the "deal"), then the little
// labels pop in. Afterwards each layer drifts a different amount with the
// pointer - nearer layers move more - which is what gives it depth.
//
//   outer  : entrance (deal)
//   middle : pointer parallax
//   inner  : endless gentle float (CSS)
export default function HeroStage({ ready, pointer }) {
  const reduced = usePrefersReducedMotion()
  const { x, y } = pointer

  const cx = useTransform(x, (v) => v * 16)
  const cy = useTransform(y, (v) => v * 12)
  const sx = useTransform(x, (v) => v * 38)
  const sy = useTransform(y, (v) => v * 26)
  const tilt = useTransform(y, (v) => -v * 5)
  const turn = useTransform(x, (v) => v * 7)
  const chipX = useTransform(x, (v) => v * 58)
  const chipY = useTransform(y, (v) => v * 40)

  const state = reduced ? false : undefined
  const run = ready ? 'show' : 'hidden'

  const card = (hidden, show) => ({
    variants: { hidden, show },
    initial: state ?? 'hidden',
    animate: reduced ? 'show' : run,
  })

  const chip = (className, rotate, delay, label, tone) => (
    <motion.div key={label} className={`absolute ${className}`} style={{ x: chipX, y: chipY }}>
      <motion.span
        variants={{ hidden: { scale: 0, opacity: 0, rotate: 0 }, show: { scale: 1, opacity: 1, rotate, transition: { ...SPRING_POP, delay } } }}
        initial={state ?? 'hidden'}
        animate={reduced ? 'show' : run}
        className={`block rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold shadow-lift ${tone}`}
      >
        {label}
      </motion.span>
    </motion.div>
  )

  return (
    <div className="relative mx-auto mt-16 h-[330px] max-w-5xl [perspective:1400px] sm:h-[430px]" aria-hidden="true">
      {/* left card */}
      <motion.div className="absolute left-[2%] top-10 hidden w-[44%] sm:block" {...card({ opacity: 0, x: '58%', y: -36, rotate: 0, scale: 0.88 }, { opacity: 0.92, x: 0, y: 0, rotate: -6, scale: 1, transition: { duration: 1.25, ease: EASE_OUT, delay: 1.05 } })}>
        <motion.div style={{ x: sx, y: sy }}>
          <div className="animate-float" style={{ animationDelay: '-2s' }}>
            <DashboardPreview variant="b" play={ready} delay={1.6} />
          </div>
        </motion.div>
      </motion.div>

      {/* right card */}
      <motion.div className="absolute right-[2%] top-14 hidden w-[44%] sm:block" {...card({ opacity: 0, x: '-58%', y: -50, rotate: 0, scale: 0.88 }, { opacity: 0.92, x: 0, y: 0, rotate: 6, scale: 1, transition: { duration: 1.25, ease: EASE_OUT, delay: 1.15 } })}>
        <motion.div style={{ x: sx, y: sy }}>
          <div className="animate-float" style={{ animationDelay: '-4s' }}>
            <DashboardPreview variant="c" play={ready} delay={1.7} />
          </div>
        </motion.div>
      </motion.div>

      {/* centre card */}
      <motion.div className="absolute inset-x-0 top-0 mx-auto w-[92%] sm:w-[62%]" {...card({ opacity: 0, y: 110, scale: 0.92, rotate: -2 }, { opacity: 1, y: 0, scale: 1, rotate: 0, transition: { duration: 1.4, ease: EASE_OUT, delay: 0.35 } })}>
        <motion.div style={{ x: cx, y: cy, rotateX: tilt, rotateY: turn }}>
          <div className="animate-float">
            <DashboardPreview variant="a" play={ready} delay={0.9} />
          </div>
        </motion.div>
      </motion.div>

      {chip('left-[6%] top-2 sm:left-[14%]', -8, 1.9, 'KPIs & deltas', 'bg-accent text-white')}
      {chip('right-[4%] top-24 sm:right-[10%]', 7, 2.05, 'Ask in plain English', 'bg-lilac text-ink')}
      {chip('bottom-6 left-[12%]', 4, 2.2, 'Cross-filtering', 'border border-line-strong bg-card text-ink')}
    </div>
  )
}
