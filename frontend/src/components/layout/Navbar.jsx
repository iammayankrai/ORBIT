import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo.jsx'
import Button from '../ui/Button.jsx'

const NAV_LINKS = [
  { label: 'Product', href: '/#product' },
  { label: 'AI Analyst', to: '/analyst' },
  { label: 'Solutions', href: '/#solutions' },
  { label: 'Technology', href: '/#technology' },
  { label: 'Demo', to: '/demo' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [signInHint, setSignInHint] = useState(false)
  const location = useLocation()

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? 'bg-white/80 backdrop-blur-lg border-b border-border shadow-[0_1px_0_0_rgba(11,13,18,0.03)]' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10" aria-label="Primary">
        <Link to="/" aria-label={`Home`}>
          <Logo />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              {link.to ? (
                <Link to={link.to} className="text-[15px] font-medium text-ink-soft transition-colors hover:text-ink">
                  {link.label}
                </Link>
              ) : (
                <a href={link.href} className="text-[15px] font-medium text-ink-soft transition-colors hover:text-ink">
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSignInHint((v) => !v)}
              className="rounded-full px-4 py-2 text-[15px] font-medium text-ink-soft transition-colors hover:text-ink"
              aria-expanded={signInHint}
            >
              Sign In
            </button>
            <AnimatePresence>
              {signInHint && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  role="status"
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-white p-4 text-left shadow-card-lg"
                >
                  <p className="text-sm text-ink-soft">
                    Accounts are coming soon. For now, explore the live product with the demo — no sign-in required.
                  </p>
                  <Link to="/demo" className="mt-2 inline-block text-sm font-medium text-accent hover:text-accent-dark">
                    Explore the demo →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button to="/analyst" variant="accent" size="md">
            Try Demo
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-2 text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border bg-white lg:hidden"
          >
            <ul className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link to={link.to} className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-surface-alt">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-surface-alt">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <Button variant="secondary" size="md" className="w-full">
                Sign In
              </Button>
              <Button to="/analyst" variant="accent" size="md" className="w-full">
                Try Demo
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
