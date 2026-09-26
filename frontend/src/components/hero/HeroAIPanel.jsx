import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { CURRENT_MONTH, PRIOR_MONTH, REGIONS, REVENUE_DECLINE_PCT } from '../../data/businessData.js'
import { inr, pct } from '../../utils/format.js'

const QUESTION = 'Why did revenue decline in July?'
const ANSWER = `Revenue declined ${pct(REVENUE_DECLINE_PCT, { decimals: 1 })} vs June (${inr(PRIOR_MONTH.revenue)} → ${inr(CURRENT_MONTH.revenue)}), driven mainly by West region (${pct(REGIONS[0].changePct, { signed: true })}).`

export default function HeroAIPanel() {
  const [stage, setStage] = useState('idle') // idle -> typing -> answered

  useEffect(() => {
    const t1 = setTimeout(() => setStage('typing'), 700)
    const t2 = setTimeout(() => setStage('answered'), 2100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <Sparkles size={15} className="text-accent" aria-hidden="true" />
        Ask your business anything
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-3.5 py-2.5 text-sm text-white">{QUESTION}</div>

        {stage === 'typing' && (
          <div className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-white px-3.5 py-3">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-ink-faint"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        )}

        {stage === 'answered' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-[92%] rounded-2xl rounded-tl-sm border border-border bg-white px-3.5 py-3 text-sm leading-relaxed text-ink-soft"
          >
            {ANSWER}
          </motion.div>
        )}
      </div>
    </div>
  )
}
