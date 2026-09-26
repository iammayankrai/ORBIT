import { useRef, useState } from 'react'
import { AlertTriangle, ArrowUp, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { askQuestion } from '../../services/dataService.js'
import SuggestedQuestions from './SuggestedQuestions.jsx'
import TypingLoader from './TypingLoader.jsx'
import AIResponseCard from './AIResponseCard.jsx'

const MAX_LENGTH = 300
const MIN_LOADING_MS = 1100

const DEFAULT_QUESTIONS = [
  'Why did sales decline?',
  'Which region performs best?',
  'What are my top products?',
  'What should I investigate?',
]

let idCounter = 0
const nextId = () => `msg-${++idCounter}`

// `datasetSource` is `{ file }` or `{ useSample: true }` — whichever
// dataset the results section above is currently showing. The backend has
// no session state, so every question re-sends it.
export default function AIChat({ datasetSource, title = 'Ask your data anything', showSuggestions = true }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  async function submit(question) {
    const trimmed = question.trim()
    if (!trimmed || loading || !datasetSource) return

    const userMsg = { id: nextId(), role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const started = Date.now()
    let result
    try {
      result = await askQuestion({ ...datasetSource, question: trimmed })
    } catch (err) {
      result = { error: true, message: err.message || 'Something went wrong. Please try again.' }
    }
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
          <p className="text-ink-soft">No questions asked yet.</p>
          <p className="mt-1 text-sm text-ink-faint">Ask your first question to get an answer with the numbers behind it.</p>
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
        <SuggestedQuestions questions={DEFAULT_QUESTIONS} onSelect={submit} disabled={loading} />
      )}

      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="ai-analyst-input" className="sr-only">
          Ask a question about your data
        </label>
        <input
          id="ai-analyst-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="Ask a question about your data…"
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
