import { API_BASE_URL } from './api.js'

async function request(path, { method = 'GET', body, timeoutMs }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { method, body, signal: controller.signal })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const error = new Error(data.detail || `Request failed with ${res.status}`)
      error.status = res.status
      throw error
    }
    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The analysis server took too long to respond. It may be waking up — please try again in a moment.')
    }
    if (err instanceof TypeError) {
      throw new Error('Could not reach the analysis server. Check your connection and try again.')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// The backend is stateless — it re-parses whatever file (or bundled demo
// dataset) is attached on every request, rather than caching a dataframe
// server-side. That keeps it safe to run on a free instance that can restart
// at any time, so every call re-sends the dataset identifier or file.
//
// `source` is { file } or { useSample: true, sampleId }.
function buildDatasetFormData({ file, useSample, sampleId }) {
  const formData = new FormData()
  if (useSample) {
    formData.append('use_sample', 'true')
    if (sampleId) formData.append('sample_id', sampleId)
  } else if (file) {
    formData.append('file', file)
  }
  return formData
}

// Generous: the free-tier backend can need ~a minute to wake from sleep.
export function analyzeDataset(source) {
  return request('/data/analyze', { method: 'POST', body: buildDatasetFormData(source), timeoutMs: 90_000 })
}

export function askQuestion({ question, ...source }) {
  const formData = buildDatasetFormData(source)
  formData.append('question', question)
  return request('/data/ask', { method: 'POST', body: formData, timeoutMs: 45_000 })
}

// Fire-and-forget ping used on the landing page so a sleeping free-tier
// backend starts waking up before the visitor clicks a demo.
export function wakeBackend() {
  request('/data/samples', { timeoutMs: 60_000 }).catch(() => {})
}
