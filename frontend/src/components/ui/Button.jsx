import { Link } from 'react-router-dom'

// Hover = a 1px lift, a soft sheen that sweeps across once, and icons nudging
// forward (children can use `group-hover:` utilities). Press = a quick squeeze.
const VARIANTS = {
  primary: 'bg-ink text-paper hover:shadow-[0_10px_30px_-10px_color-mix(in_srgb,var(--ink)_60%,transparent)]',
  accent: 'bg-accent text-white hover:shadow-[0_10px_30px_-8px_color-mix(in_srgb,var(--accent)_70%,transparent)]',
  secondary: 'border border-line-strong bg-card text-ink hover:border-ink/40',
  ghost: 'bg-transparent text-ink hover:bg-card-alt',
}

const SIZES = {
  sm: 'px-3.5 py-1.5 text-[13px]',
  md: 'px-5 py-2.5 text-[14.5px]',
  lg: 'px-7 py-3.5 text-[15.5px]',
}

const SHEEN =
  "relative overflow-hidden before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:opacity-0 hover:before:translate-x-[320%] hover:before:opacity-100 before:transition-[transform,opacity] before:duration-700 before:ease-[var(--ease-out)]"

export default function Button({ as, to, href, variant = 'primary', size = 'md', className = '', children, ...props }) {
  const classes = `group inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-[var(--ease-out)] hover:-translate-y-px active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${variant === 'primary' || variant === 'accent' ? SHEEN : ''} ${VARIANTS[variant]} ${SIZES[size]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }
  const Component = as || 'button'
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}
