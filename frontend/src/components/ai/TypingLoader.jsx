import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const STAGES = ['Analyzing your data...', 'Finding key drivers...', 'Preparing your insight...']

export default function TypingLoader() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 550)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm border border-border bg-white px-4 py-3.5">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <motion.span key={stage} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-ink-soft">
        {STAGES[stage]}
      </motion.span>
    </div>
  )
}
