import { motion } from 'framer-motion'
import { DUR, EASE_OUT, STAGGER, VIEWPORT } from './tokens.js'
import { usePrefersReducedMotion } from './hooks.js'

// Block reveal: rise + fade once, when the element is ~12% into the viewport.
export function Reveal({ as = 'div', className = '', delay = 0, y = 28, children, ...rest }) {
  const reduced = usePrefersReducedMotion()
  const Tag = reduced ? as : motion[as]
  if (reduced) return <Tag className={className} {...rest}>{children}</Tag>
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: DUR.slow, ease: EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// A group whose RevealItem children enter one after another.
export function RevealGroup({ as = 'div', className = '', stagger = STAGGER.cards, delay = 0, children, ...rest }) {
  const reduced = usePrefersReducedMotion()
  const Tag = reduced ? as : motion[as]
  if (reduced) return <Tag className={className} {...rest}>{children}</Tag>
  return (
    <Tag className={className} initial="hidden" whileInView="show" viewport={VIEWPORT} variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }} {...rest}>
      {children}
    </Tag>
  )
}

// `rotate` gives the "dealt cards" feel: items land from a slight tilt.
export function RevealItem({ as = 'div', className = '', y = 44, rotate = 0, scale = 0.97, duration = 1, children, ...rest }) {
  const reduced = usePrefersReducedMotion()
  const Tag = reduced ? as : motion[as]
  if (reduced) return <Tag className={className} {...rest}>{children}</Tag>
  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, y, rotate, scale },
        show: { opacity: 1, y: 0, rotate: 0, scale: 1, transition: { duration, ease: EASE_OUT } },
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
