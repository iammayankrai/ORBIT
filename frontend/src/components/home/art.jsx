import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { usePrefersReducedMotion } from '../../motion/hooks.js'
import { EASE_OUT } from '../../motion/tokens.js'

// Decorative, data-free illustrations: the dashboards floating in the hero and
// the thumbnails on the demo cards. Both draw themselves in (lines trace,
// bars grow) the first time they are on screen.

const AREA = 'M0 78 C 24 70, 40 52, 64 58 S 108 30, 134 36 S 178 14, 204 20 L204 96 L0 96 Z'
const LINE = 'M0 78 C 24 70, 40 52, 64 58 S 108 30, 134 36 S 178 14, 204 20'

// Shared "draw in" helper: when `on` is false the shape sits in its hidden
// state; when true it animates to rest. Reduced motion renders the rest state.
function useDraw(on) {
  const reduced = usePrefersReducedMotion()
  return (hidden, shown, delay = 0, duration = 0.9) => ({
    initial: reduced ? false : hidden,
    animate: on || reduced ? shown : hidden,
    transition: { duration, delay, ease: EASE_OUT },
  })
}

export function DashboardPreview({ variant = 'a', className = '', play = true, delay = 0 }) {
  const draw = useDraw(play)
  const color = { a: 'var(--s1)', b: 'var(--s3)', c: 'var(--s2)' }[variant]
  const bars = { a: [62, 40, 78, 52, 90, 66], b: [30, 55, 44, 80, 58, 72], c: [74, 50, 66, 38, 84, 48] }[variant]
  return (
    <div aria-hidden="true" className={`overflow-hidden rounded-2xl border border-line-strong bg-card shadow-lift ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-line bg-card-alt px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-negative/70" />
        <span className="h-2 w-2 rounded-full bg-warning/80" />
        <span className="h-2 w-2 rounded-full bg-positive/80" />
        <span className="ml-3 h-4 w-32 rounded-full bg-line" />
      </div>
      <div className="grid grid-cols-[34px_1fr]">
        <div className="flex flex-col items-center gap-2 border-r border-line py-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="h-4 w-4 rounded-md" style={{ background: i === 0 ? color : 'var(--line)' }} />
          ))}
        </div>
        <div className="p-3">
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-line p-2">
                <span className="block h-1.5 w-8 rounded bg-line-strong" />
                <motion.span className="mt-2 block h-3 w-12 origin-left rounded" style={{ background: i === 0 ? color : 'var(--ink)', opacity: i === 0 ? 1 : 0.8 }} {...draw({ scaleX: 0 }, { scaleX: 1 }, delay + 0.45 + i * 0.09, 0.8)} />
                <span className="mt-1.5 block h-1.5 w-6 rounded" style={{ background: i % 3 === 1 ? 'var(--negative)' : 'var(--positive)', opacity: 0.7 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-[1.7fr_1fr] gap-2">
            <div className="rounded-lg border border-line p-2">
              <span className="block h-1.5 w-16 rounded bg-line-strong" />
              <svg viewBox="0 0 204 96" className="mt-1 h-24 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`hero-${variant}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path d={AREA} fill={`url(#hero-${variant})`} {...draw({ opacity: 0 }, { opacity: 1 }, delay + 1.1, 1)} />
                <motion.path d={LINE} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" {...draw({ pathLength: 0 }, { pathLength: 1 }, delay + 0.55, 1.7)} />
              </svg>
            </div>
            <div className="rounded-lg border border-line p-2">
              <span className="block h-1.5 w-12 rounded bg-line-strong" />
              <div className="mt-3 flex flex-col gap-1.5">
                {bars.slice(0, 5).map((w, i) => (
                  <motion.span key={i} className="block h-2 origin-left rounded-full" style={{ width: `${w}%`, background: color, opacity: 1 - i * 0.14 }} {...draw({ scaleX: 0 }, { scaleX: 1 }, delay + 0.8 + i * 0.07, 0.8)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DemoArt({ kind, color }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const draw = useDraw(inView)
  const wrap = 'relative flex h-full w-full items-center justify-center overflow-hidden'
  const style = { background: `linear-gradient(135deg, color-mix(in srgb, ${color} 18%, var(--card)), color-mix(in srgb, ${color} 4%, var(--card)))` }
  const gid = `art-${kind}`
  return (
    <div ref={ref} className={wrap} style={style} aria-hidden="true">
      {kind === 'trend' && (
        <svg viewBox="0 0 204 96" className="h-[62%] w-[74%]" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.45" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path d={AREA} fill={`url(#${gid})`} {...draw({ opacity: 0 }, { opacity: 1 }, 0.5, 1)} />
          <motion.path d={LINE} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" {...draw({ pathLength: 0 }, { pathLength: 1 }, 0, 1.5)} />
        </svg>
      )}
      {kind === 'bars' && (
        <div className="flex h-[58%] w-[70%] items-end gap-2">
          {[38, 62, 48, 86, 58, 74, 44].map((h, i) => (
            <motion.span key={i} className="flex-1 origin-bottom rounded-t-md" style={{ height: `${h}%`, background: color, opacity: 0.45 + (h / 86) * 0.55 }} {...draw({ scaleY: 0 }, { scaleY: 1 }, i * 0.07, 0.9)} />
          ))}
        </div>
      )}
      {kind === 'donut' && (
        <svg viewBox="0 0 100 100" className="h-[78%] -rotate-90">
          {[
            [44, 0, 1],
            [26, 44, 0.7],
            [18, 70, 0.45],
            [12, 88, 0.25],
          ].map(([len, off, o], i) => (
            <motion.circle key={off} cx="50" cy="50" r="34" fill="none" stroke={color} strokeWidth="15" strokeOpacity={o} strokeDashoffset={-off * 2.136} {...draw({ strokeDasharray: '0 400' }, { strokeDasharray: `${len * 2.136 - 1.5} 400` }, i * 0.18, 1)} />
          ))}
        </svg>
      )}
      {kind === 'heat' && (
        <div className="grid h-[62%] w-[70%] grid-cols-8 gap-1">
          {Array.from({ length: 40 }, (_, i) => (
            <motion.span key={i} className="rounded-[3px]" style={{ background: color, opacity: 0.12 + (((i * 37) % 11) / 11) * 0.88 }} {...draw({ scale: 0.4, opacity: 0 }, { scale: 1, opacity: 0.12 + (((i * 37) % 11) / 11) * 0.88 }, (i % 8) * 0.04 + Math.floor(i / 8) * 0.04, 0.6)} />
          ))}
        </div>
      )}
      {kind === 'line' && (
        <svg viewBox="0 0 204 96" className="h-[62%] w-[74%]" preserveAspectRatio="none">
          <motion.path d="M0 70 C 30 60, 50 40, 80 46 S 130 70, 160 40 S 190 24, 204 18" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" {...draw({ pathLength: 0 }, { pathLength: 1 }, 0, 1.5)} />
          <motion.path d="M0 40 C 30 46, 60 58, 90 50 S 140 34, 170 54 S 196 62, 204 58" fill="none" stroke={color} strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" {...draw({ pathLength: 0 }, { pathLength: 1 }, 0.25, 1.5)} />
        </svg>
      )}
      {kind === 'gauge' && (
        <div className="flex w-[64%] flex-col items-center">
          <svg viewBox="0 0 120 70" className="w-full">
            <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="var(--line-strong)" strokeWidth="11" strokeLinecap="round" />
            <motion.path d="M10 62 A50 50 0 0 1 92 24" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" {...draw({ pathLength: 0 }, { pathLength: 1 }, 0.1, 1.3)} />
          </svg>
          <div className="-mt-1 flex w-full gap-1.5">
            {[70, 48, 84].map((w, i) => (
              <span key={w} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong">
                <motion.span className="block h-full origin-left rounded-full" style={{ width: `${w}%`, background: color }} {...draw({ scaleX: 0 }, { scaleX: 1 }, 0.6 + i * 0.1, 0.8)} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
