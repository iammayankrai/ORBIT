import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { DUR, EASE_OUT, STAGGER } from './tokens.js'
import { usePrefersReducedMotion } from './hooks.js'

// Headline reveal: every word rises from slightly below while it de-blurs,
// staggered left to right. The signature move of the whole site.
//
//   <SplitReveal as="h2" text="Explore, filter & experience" />        plays once, on scroll
//   <SplitReveal as="h1" text={...} play={heroReady} delay={0.2} />    plays when `play` turns true
//
// Use "\n" in `text` for a forced line break. The full sentence is exposed to
// assistive tech via aria-label; the animated word spans are hidden from it.
export default function SplitReveal({ text, as = 'h2', className = '', delay = 0, stagger = STAGGER.words, play, blur = 6, y = '40%', duration = DUR.slow }) {
  const reduced = usePrefersReducedMotion()
  const lines = text.split('\n')
  const Tag = motion[as]
  const Plain = as

  if (reduced) {
    return (
      <Plain className={className}>
        {lines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </Plain>
    )
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }
  const word = {
    hidden: { opacity: 0, y, filter: `blur(${blur}px)` },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration, ease: EASE_OUT } },
  }
  const trigger = play === undefined ? { whileInView: 'show', viewport: { once: true, margin: '0px 0px -14% 0px' } } : { animate: play ? 'show' : 'hidden' }

  return (
    <Tag className={className} aria-label={text.replace(/\n/g, ' ')} variants={container} initial="hidden" {...trigger}>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(' ').map((w, i, arr) => (
            <Fragment key={i}>
              <motion.span aria-hidden="true" className="inline-block" variants={word}>
                {w}
              </motion.span>
              {i < arr.length - 1 && ' '}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Tag>
  )
}
