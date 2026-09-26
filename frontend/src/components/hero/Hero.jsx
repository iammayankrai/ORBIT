import { motion } from 'framer-motion'
import Container from '../ui/Container.jsx'
import UploadPanel from '../upload/UploadPanel.jsx'
import HeroPreviewCards from './HeroPreviewCards.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } }),
}

export default function Hero({ onAnalyzed }) {
  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden pb-10 pt-24 sm:pt-28">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]"
        style={{
          background: 'radial-gradient(60% 50% at 50% 0%, var(--color-accent-soft) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-[760px] xl:block"
        style={{
          backgroundImage: 'radial-gradient(rgba(11,13,18,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(60% 55% at 50% 45%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(60% 55% at 50% 45%, black 0%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      <Container className="flex flex-col items-center text-center">
        <motion.div initial="hidden" animate="show" custom={0} variants={fadeUp}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-ink-soft shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            From spreadsheet to insight, instantly
          </span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="show"
          custom={0.08}
          variants={fadeUp}
          className="mt-5 max-w-4xl text-balance text-[32px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[44px] lg:text-[56px]"
        >
          Turn Your Data Into Decisions.
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={0.16}
          variants={fadeUp}
          className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-ink-soft sm:text-lg"
        >
          Upload your Excel or CSV and instantly get dashboards, insights and AI-powered answers.
        </motion.p>

        <motion.div initial="hidden" animate="show" custom={0.26} variants={fadeUp} className="relative mt-8 flex w-full justify-center">
          <HeroPreviewCards />
          <UploadPanel onAnalyzed={onAnalyzed} />
        </motion.div>
      </Container>
    </section>
  )
}
