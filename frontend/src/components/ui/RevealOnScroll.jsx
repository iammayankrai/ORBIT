import { motion } from 'framer-motion'

export default function RevealOnScroll({ children, className = '', delay = 0, y = 16, as = 'div' }) {
  const Component = motion[as] || motion.div
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  )
}
