import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

const STEPS = ['Uploading your file…', 'Reading dataset…', 'Understanding columns…', 'Finding patterns…', 'Generating insights…']

const STEP_DURATION_MS = 550

// Purely visual pacing — advances on its own timer rather than tracking the
// real request, so the reveal feels considered on a fast connection and
// isn't cut short on a slow one. The parent waits for onDone() AND its own
// API call before showing results, whichever finishes later.
export default function ProcessingSequence({ onDone }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (activeIndex >= STEPS.length) {
      onDone?.()
      return
    }
    const timer = setTimeout(() => setActiveIndex((i) => i + 1), STEP_DURATION_MS)
    return () => clearTimeout(timer)
  }, [activeIndex, onDone])

  return (
    <div className="flex flex-col gap-3">
      {STEPS.map((step, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending'
        return (
          <motion.div
            key={step}
            animate={{ opacity: state === 'pending' ? 0.35 : 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {state === 'done' && <Check size={15} className="text-accent" aria-hidden="true" />}
              {state === 'active' && <Loader2 size={15} className="animate-spin text-accent" aria-hidden="true" />}
              {state === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-ink-faint/40" aria-hidden="true" />}
            </span>
            <span className={`text-[15px] ${state === 'active' ? 'font-medium text-ink' : 'text-ink-soft'}`}>{step}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
