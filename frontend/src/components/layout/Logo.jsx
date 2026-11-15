import { BRAND_NAME } from '../../config/brand.js'

export default function Logo({ className = '', size = 26 }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <ellipse cx="32" cy="32" rx="27" ry="12" stroke="var(--ink)" strokeWidth="5" fill="none" />
        <circle cx="32" cy="32" r="7.5" fill="var(--accent)" />
      </svg>
      <span className="text-[19px] font-semibold tracking-tight text-ink">{BRAND_NAME}</span>
    </span>
  )
}
