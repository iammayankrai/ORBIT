import { useRef } from 'react'
import { useInView } from 'framer-motion'

// Ambient hero backdrop: faint tilted orbits with a small glowing body
// travelling each one - the brand idea, kept very quiet. Pure CSS motion
// (transform/offset-distance only), paused whenever it is off-screen.
const RINGS = [
  { s: 1, r: '-9deg', d: '46s', delay: '0s' },
  { s: 0.72, r: '7deg', d: '34s', delay: '-12s' },
  { s: 1.35, r: '-3deg', d: '70s', delay: '-30s' },
]

export default function OrbitRings({ className = '' }) {
  const ref = useRef(null)
  const visible = useInView(ref, { margin: '80px' })
  return (
    <div ref={ref} data-off={!visible} aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(62%_60%_at_50%_48%,black,transparent)] ${className}`}>
      {RINGS.map((ring, i) => (
        <div key={i} className="orbit-ring" style={{ '--s': ring.s, '--r': ring.r }}>
          <span className="orbit-ring__body" style={{ '--d': ring.d, '--delay': ring.delay }} />
        </div>
      ))}
    </div>
  )
}
