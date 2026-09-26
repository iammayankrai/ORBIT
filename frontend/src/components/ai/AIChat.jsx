import { useRef, useState } from 'react'
import { AlertTriangle, ArrowUp, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { askAIAnalyst } from '../../services/aiService.js'
import { SUGGESTED_QUESTIONS } from '../../data/aiResponses.js'
import SuggestedQuestions from './SuggestedQuestions.jsx'
import TypingLoader from './TypingLoader.jsx'
import AIResponseCard from './AIResponseCard.jsx'

const MAX_LENGTH = 300
const MIN_LOADING_MS = 1300

let idCounter = 0
const nextId = () => `msg-${++idCounter}`

export default function AIChat({ title = 'Ask your business anything', showSuggestions = true }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  async function submit(question) {
    const trimmed = question.trim()
    if (!trimmed || loading) return

    const userMsg = { id: nextId(), role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const started = Date.now()
    const result = await askAIAnalyst(trimmed)
    const elapsed = Date.now() - started
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed))
    }

    setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', result }])
    setLoading(false)
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    submit(input)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-accent" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
      </div>

      {messages.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface-alt/50 px-6 py-10 text-center">
          <p className="text-ink-soft">No insights yet.</p>
          <p className="mt-1 text-sm text-ink-faint">Ask your first business question to generate an analysis.</p>
        </div>
      )}

      <div className="flex flex-col gap-4" aria-live="polite">
        {messages.map((m) =>
          m.role === 'user' ? (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-4 py-2.5 text-[15px] text-white"
            >
              {m.text}
            </motion.div>
          ) : (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              {m.result?.error ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{m.result.message}</span>
                </div>
              ) : (
                <AIResponseCard response={m.result} />
              )}
            </motion.div>
          ),
        )}
        {loading && <TypingLoader />}
        <div ref={endRef} />
      </div>

      {showSuggestions && messages.length === 0 && (
        <SuggestedQuestions questions={SUGGESTED_QUESTIONS} onSelect={submit} disabled={loading} />
      )}

      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="ai-analyst-input" className="sr-only">
          Ask a business question
        </label>
        <input
          id="ai-analyst-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="Ask about revenue, regions, products, inventory or targets…"
          disabled={loading}
          className="w-full rounded-full border border-border bg-white py-3.5 pl-5 pr-14 text-[15px] text-ink placeholder:text-ink-faint focus-visible:border-accent disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send question"
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-white transition-opacity disabled:opacity-30"
        >
          <ArrowUp size={17} />
        </button>
      </form>
    </div>
  )
}
