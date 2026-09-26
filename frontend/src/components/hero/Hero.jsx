import { motion } from 'framer-motion'
import Button from '../ui/Button.jsx'
import Container from '../ui/Container.jsx'
import DashboardPreview from './DashboardPreview.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } }),
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-36 sm:pb-28 sm:pt-44">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]"
        style={{
          background: 'radial-gradient(60% 50% at 50% 0%, var(--color-accent-soft) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <Container className="flex flex-col items-center text-center">
        <motion.div initial="hidden" animate="show" custom={0} variants={fadeUp}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-ink-soft shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Introducing AI Business Analyst
          </span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="show"
          custom={0.08}
          variants={fadeUp}
          className="mt-7 max-w-4xl text-balance text-[40px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[56px] lg:text-[72px]"
        >
          Turn Your Business Data Into Decisions.
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={0.16}
          variants={fadeUp}
          className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-ink-soft sm:text-xl"
        >
          AI-powered business intelligence that helps you understand what happened, why it happened, and what to do next.
        </motion.p>

        <motion.div initial="hidden" animate="show" custom={0.24} variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button to="/analyst" variant="accent" size="lg">
            Try AI Analyst
          </Button>
          <Button href="/#product" variant="secondary" size="lg">
            Explore Platform
          </Button>
        </motion.div>

        <div className="mt-16 w-full sm:mt-20 lg:mt-24">
          <DashboardPreview />
        </div>
      </Container>
    </section>
  )
}
