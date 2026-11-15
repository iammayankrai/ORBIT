import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'bg-ink text-paper hover:opacity-90',
  accent: 'bg-accent text-white hover:brightness-110',
  secondary: 'border border-line-strong bg-card text-ink hover:border-ink/40',
  ghost: 'bg-transparent text-ink hover:bg-card-alt',
}

const SIZES = {
  sm: 'px-3.5 py-1.5 text-[13px]',
  md: 'px-5 py-2.5 text-[14.5px]',
  lg: 'px-7 py-3.5 text-[15.5px]',
}

export default function Button({ as, to, href, variant = 'primary', size = 'md', className = '', children, ...props }) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-all duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`

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
