import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'bg-ink text-white hover:bg-black shadow-sm',
  accent: 'bg-accent text-white hover:bg-accent-dark shadow-sm',
  secondary: 'bg-white text-ink border border-border hover:border-ink/30 hover:bg-surface-alt',
  ghost: 'bg-transparent text-ink hover:bg-surface-alt',
}

const SIZES = {
  sm: 'px-3.5 py-1.5 text-[13px]',
  md: 'px-5 py-2.5 text-[15px]',
  lg: 'px-7 py-3.5 text-base',
}

export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-accent ${VARIANTS[variant]} ${SIZES[size]} ${className}`

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
