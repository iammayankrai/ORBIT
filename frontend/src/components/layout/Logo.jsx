import { BRAND_NAME } from '../../config/brand.js'

export default function Logo({ className = '', dark = false }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <ellipse cx="32" cy="32" rx="27" ry="12" stroke={dark ? '#fff' : 'var(--color-ink)'} strokeWidth="5" fill="none" />
        <circle cx="32" cy="32" r="7.5" fill="var(--color-accent)" />
      </svg>
      <span className={`text-[19px] font-semibold tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>{BRAND_NAME}</span>
    </span>
  )
}
