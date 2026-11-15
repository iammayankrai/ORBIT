import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const LINKS = [
  { label: 'Demos', to: '/#demos' },
  { label: 'Capabilities', to: '/#capabilities' },
  { label: 'Process', to: '/#process' },
  { label: 'Work', to: '/#work' },
  { label: 'FAQ', to: '/#faq' },
]

export default function Navbar() {
  return (
    <header className="glass fixed inset-x-0 top-0 z-50 h-[60px] border-b border-line">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" aria-label="Orbit home">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-full px-3.5 py-1.5 text-[14px] font-medium text-ink-soft transition-colors hover:bg-card-alt hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Button to="/#upload" size="sm">
            Upload data
          </Button>
        </div>
      </div>
    </header>
  )
}
