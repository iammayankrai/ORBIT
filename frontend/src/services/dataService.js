import { API_BASE_URL } from './api.js'

async function postMultipart(path, formData, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const error = new Error(body.detail || `Request failed with ${res.status}`)
      error.status = res.status
      throw error
    }
    return body
  } finally {
    clearTimeout(timer)
  }
}

// The backend is stateless — it re-parses whatever file (or the bundled
// sample) is attached on every request, rather than caching a dataframe
// server-side. That's what keeps it safe to run on a free instance that
// can restart at any time, so every call here re-sends the dataset.
function buildDatasetFormData({ file, useSample }) {
  const formData = new FormData()
  if (useSample) {
    formData.append('use_sample', 'true')
  } else if (file) {
    formData.append('file', file)
  }
  return formData
}

export async function analyzeDataset({ file, useSample }) {
  const formData = buildDatasetFormData({ file, useSample })
  return postMultipart('/data/analyze', formData, 45000)
}

export async function askQuestion({ file, useSample, question }) {
  const formData = buildDatasetFormData({ file, useSample })
  formData.append('question', question)
  return postMultipart('/data/ask', formData, 30000)
}
