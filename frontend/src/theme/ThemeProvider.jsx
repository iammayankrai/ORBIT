import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'

const ThemeContext = createContext({ theme: 'dark', toggle: () => {} })

function readInitial() {
  const attr = document.documentElement.getAttribute('data-theme')
  return attr === 'light' ? 'light' : 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0e0d0b' : '#f4f1ea')
    try {
      localStorage.setItem('orbit-theme', theme)
    } catch {
      /* storage can be blocked (private mode) — the toggle still works for the session */
    }
  }, [theme])

  // The attribute is flipped synchronously (not in the effect) so that charts
  // reading CSS variables during the re-render already see the new palette.
  //
  // Where the browser supports View Transitions the new theme is revealed as a
  // circle expanding from the toggle button; elsewhere (or with reduced
  // motion) it simply switches.
  const toggle = useCallback((event) => {
    const root = document.documentElement
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
    const apply = () => {
      root.setAttribute('data-theme', next)
      flushSync(() => setTheme(next))
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduced) {
      apply()
      return
    }
    // Read the origin now - React clears event.currentTarget after the handler.
    const rect = event?.currentTarget?.getBoundingClientRect?.()
    const x = event?.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth - 40)
    const y = event?.clientY || (rect ? rect.top + rect.height / 2 : 40)
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    document
      .startViewTransition(apply)
      .ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 560, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {})
  }, [])
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
