export default function Sparkline({ data, width = 72, height = 28, color = '#3b5bfd', trackColor = '#e6e8ec' }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data.map((v, i) => [i * step, height - ((v - min) / range) * height])
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} stroke={trackColor} strokeWidth="1" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}
