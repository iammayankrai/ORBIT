export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export async function apiFetch(path, options = {}, timeoutMs = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const error = new Error(body.detail || `Request failed with ${res.status}`)
      error.status = res.status
      throw error
    }
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}
