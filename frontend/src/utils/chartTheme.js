// Validated against the dataviz skill's palette checks (adjacent-pair CVD +
// normal-vision floors pass; the WARN on contrast is mitigated by always
// pairing color with a direct text label, never color alone).
export const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300']

// Sequential blue ramp, ordinal steps 250/400/500/600 (light->dark, each clears 2:1).
export const SEQUENTIAL_BLUE = ['#86b6ef', '#3987e5', '#256abf', '#184f95']

export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
}

export const CHART_INK = {
  grid: '#e6e8ec',
  axis: '#c3c2b7',
  muted: '#8a919e',
  primary: '#0b0d12',
}

export const ACCENT = '#3b5bfd'
