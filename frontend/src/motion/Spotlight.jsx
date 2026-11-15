import { useRef } from 'react'
import { useFinePointer } from './hooks.js'

// Wraps any element (a div, a router <Link>...) so a soft glow follows the
// cursor across its surface. It only writes two CSS variables - no React
// re-renders, no layout - and the glow itself is styled in index.css (.spot).
export default function Spotlight({ as: Tag = 'div', className = '', children, ...rest }) {
  const raf = useRef(0)
  const fine = useFinePointer()

  function move(e) {
    if (!fine) return
    const el = e.currentTarget
    const { clientX, clientY } = e
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${clientX - r.left}px`)
      el.style.setProperty('--my', `${clientY - r.top}px`)
    })
  }

  return (
    <Tag className={`spot ${className}`} onPointerMove={move} {...rest}>
      <span className="spot__glow" aria-hidden="true" />
      {children}
    </Tag>
  )
}
