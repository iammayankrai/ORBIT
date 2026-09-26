import { apiFetch } from './api.js'
import { getDemoAIResponse } from '../data/aiResponses.js'

const MAX_QUESTION_LENGTH = 300

export const AI_ERROR = {
  RATE_LIMITED: 'rate_limited',
  TOO_LONG: 'too_long',
  UNKNOWN: 'unknown',
}

// Tries the live backend first (real SQL analysis + AI explanation). If the
// backend isn't deployed, is unreachable, or times out, falls back to the
// local demo engine so the public site always has something real to show —
// this is why the site works with zero infrastructure running.
export async function askAIAnalyst(question) {
  const trimmed = question.trim()
  if (!trimmed) return null
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return { error: AI_ERROR.TOO_LONG, message: `Questions are limited to ${MAX_QUESTION_LENGTH} characters.` }
  }

  try {
    const data = await apiFetch('/ai/ask', { method: 'POST', body: JSON.stringify({ question: trimmed }) }, 20000)
    // Backend reports its own source (live/demo/cache) — trust it, only default if missing.
    return { source: 'live', ...data }
  } catch (err) {
    if (err.status === 429) {
      return { error: AI_ERROR.RATE_LIMITED, message: "You've reached today's free question limit. Try again tomorrow, or explore the suggested questions above." }
    }
    const demo = getDemoAIResponse(trimmed)
    return { ...demo, source: 'local-fallback' }
  }
}
