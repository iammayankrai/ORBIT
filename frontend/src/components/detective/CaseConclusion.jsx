import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { OFFICIAL_EXPLANATION, scoreConclusion } from '../../data/detectiveCase.js'
import Button from '../ui/Button.jsx'

export default function CaseConclusion() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setResult(scoreConclusion(text))
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">{result.verdict}</h3>
          <span className="rounded-full bg-accent-soft px-3.5 py-1 text-sm font-semibold text-accent-dark">{result.score}/100</span>
        </div>

        <ul className="mt-5 flex flex-col gap-2.5">
          {[...result.matched, ...result.missed].map((c) => (
            <li key={c.key} className="flex items-center gap-2.5 text-sm">
              {c.hit ? (
                <Check size={16} className="shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <X size={16} className="shrink-0 text-ink-faint" aria-hidden="true" />
              )}
              <span className={c.hit ? 'text-ink' : 'text-ink-faint'}>{c.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl bg-surface-alt px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">What actually happened</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{OFFICIAL_EXPLANATION}</p>
        </div>

        <Button
          variant="secondary"
          size="md"
          className="mt-5"
          onClick={() => {
            setResult(null)
            setText('')
          }}
        >
          Try another explanation
        </Button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6">
      <h3 className="text-lg font-semibold text-ink">What's your conclusion?</h3>
      <p className="mt-1 text-sm text-ink-soft">Explain what caused the decline — be as specific as the data lets you be.</p>
      <label htmlFor="conclusion" className="sr-only">
        Your conclusion
      </label>
      <textarea
        id="conclusion"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 600))}
        rows={4}
        placeholder="e.g. South region declined because…"
        className="mt-4 w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus-visible:border-accent"
      />
      <Button type="submit" variant="accent" size="md" className="mt-4" disabled={!text.trim()}>
        Submit conclusion
      </Button>
    </form>
  )
}
