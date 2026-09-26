import { useState } from 'react'
import { ArrowUp, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { askDetective } from '../../data/detectiveCase.js'

const HINTS = ['Which region?', 'What changed in pricing?', 'When did it start?', 'Is inventory a factor?']

let idCounter = 0
const nextId = () => `case-${++idCounter}`

export default function CaseChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  function ask(question) {
    const trimmed = question.trim()
    if (!trimmed) return
    const answer = askDetective(trimmed)
    setMessages((prev) => [...prev, { id: nextId(), question: trimmed, answer }])
    setInput('')
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent" aria-hidden="true" />
        <h3 className="text-base font-semibold text-ink">Ask the analyst</h3>
      </div>

      {messages.length === 0 && (
        <p className="text-sm text-ink-faint">
          Ask a question about the case, or use the investigation tools above to look for clues yourself.
        </p>
      )}

      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto" aria-live="polite">
        {messages.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-3.5 py-2 text-sm text-white">{m.question}</div>
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-border bg-surface-alt px-3.5 py-2.5 text-sm leading-relaxed text-ink-soft">
              {m.answer}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {HINTS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => ask(h)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent-dark"
          >
            {h}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
        className="relative"
      >
        <label htmlFor="detective-input" className="sr-only">
          Ask the analyst about this case
        </label>
        <input
          id="detective-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 200))}
          placeholder="Ask about region, pricing, month…"
          className="w-full rounded-full border border-border bg-white py-3 pl-4 pr-12 text-sm text-ink placeholder:text-ink-faint focus-visible:border-accent"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-white disabled:opacity-30"
        >
          <ArrowUp size={15} />
        </button>
      </form>
    </div>
  )
}
