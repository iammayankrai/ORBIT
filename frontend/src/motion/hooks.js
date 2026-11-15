import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// `useReducedMotion` can return null before it has read the media query.
export function usePrefersReducedMotion() {
  return Boolean(useReducedMotion())
}

function useMedia(query, initial = false) {
  const [matches, setMatches] = useState(() => (typeof window === 'undefined' ? initial : window.matchMedia(query).matches))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

// Mouse-style pointer (not touch): gate hover-driven effects such as magnetic
// buttons, cursor spotlights and hero tilt behind this.
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)')

// Phones and small tablets get lighter choreography.
export const useCompactViewport = () => useMedia('(max-width: 820px)')
