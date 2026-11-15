import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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
  const toggle = useCallback(() => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    setTheme(next)
  }, [])
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

// Charts need real colour strings, so read the active theme's tokens once per
// theme change instead of hard-coding two palettes in every chart.
export function useChartColors() {
  const { theme } = useTheme()
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement)
    const v = (name) => cs.getPropertyValue(name).trim()
    return {
      theme,
      accent: v('--accent'),
      ink: v('--ink'),
      muted: v('--ink-faint'),
      grid: v('--line'),
      gridStrong: v('--line-strong'),
      card: v('--card'),
      positive: v('--positive'),
      negative: v('--negative'),
      warning: v('--warning'),
      series: ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7'].map(v),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])
}
