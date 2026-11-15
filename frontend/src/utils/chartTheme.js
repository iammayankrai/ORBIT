// Chart colours are CSS-variable references, so every chart follows the
// light/dark theme automatically (SVG presentation attributes resolve var()).
export const CATEGORICAL = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)', 'var(--s7)']

export const SEQUENTIAL_BLUE = ['var(--accent)', 'var(--accent)', 'var(--accent)', 'var(--accent)']

export const STATUS = {
  good: 'var(--positive)',
  warning: 'var(--warning)',
  serious: 'var(--s2)',
  critical: 'var(--negative)',
}

export const CHART_INK = {
  grid: 'var(--line)',
  axis: 'var(--line-strong)',
  muted: 'var(--ink-faint)',
  primary: 'var(--ink)',
}

export const ACCENT = 'var(--accent)'
