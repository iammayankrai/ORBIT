import { createContext, useCallback, useContext, useMemo, useState } from 'react'

// Tracks the opening sequence so the rest of the page can wait for it:
//   'playing'   the loader covers the screen
//   'revealing' the loader is lifting - the hero starts entering underneath
//   'done'      everything is released (scroll unlocked, smooth-scroll on)
const MotionContext = createContext({ phase: 'done', heroReady: true, introDone: true, setPhase: () => {} })

const STORAGE_KEY = 'orbit-intro-seen'

function shouldPlayIntro() {
  if (typeof window === 'undefined') return false
  // Set VITE_DISABLE_INTRO=true at build time to turn the opening loader off.
  if (import.meta.env.VITE_DISABLE_INTRO === 'true') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  // Only the marketing home page opens with the loader - never a direct
  // dashboard link, an anchor link, or a return visit within the session.
  if (window.location.pathname !== '/' || window.location.hash) return false
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return false
  } catch {
    /* storage blocked: play it, it just won't be remembered */
  }
  return true
}

export function MotionProvider({ children }) {
  const [phase, setPhaseState] = useState(() => (shouldPlayIntro() ? 'playing' : 'done'))

  const setPhase = useCallback((next) => {
    setPhaseState(next)
    if (next === 'done') {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* ignore */
      }
    }
  }, [])

  const value = useMemo(() => ({ phase, setPhase, heroReady: phase !== 'playing', introDone: phase === 'done' }), [phase, setPhase])
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}

export const useMotionPhase = () => useContext(MotionContext)
