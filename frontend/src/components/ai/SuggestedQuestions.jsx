export default function SuggestedQuestions({ questions, onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(q)}
          className="rounded-full border border-border bg-white px-4 py-2 text-sm text-ink-soft transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent-dark disabled:pointer-events-none disabled:opacity-50"
        >
          {q}
        </button>
      ))}
    </div>
  )
}
