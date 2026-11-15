import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import Button from '../ui/Button.jsx'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import Magnetic from '../../motion/Magnetic.jsx'
import { useMotionPhase } from '../../motion/MotionProvider.jsx'
import ScrollProgress from '../../motion/ScrollProgress.jsx'
import { EASE_OUT, SPRING_SOFT } from '../../motion/tokens.js'

const LINKS = [
  { label: 'Demos', id: 'demos' },
  { label: 'Capabilities', id: 'capabilities' },
  { label: 'Process', id: 'process' },
  { label: 'Work', id: 'work' },
  { label: 'FAQ', id: 'faq' },
]

// Which landing section is currently in the middle of the screen.
function useActiveSection() {
  const [active, setActive] = useState(null)
  useEffect(() => {
    const seen = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting))
        const current = LINKS.find((l) => seen.get(l.id))
        setActive(current?.id ?? null)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    const watch = () => LINKS.forEach((l) => document.getElementById(l.id) && observer.observe(document.getElementById(l.id)))
    watch()
    // Sections mount with the lazy page, so look again shortly after.
    const t = setTimeout(watch, 600)
    return () => {
      clearTimeout(t)
      observer.disconnect()
    }
  }, [])
  return active
}

export default function Navbar() {
  const { pathname } = useLocation()
  const { heroReady } = useMotionPhase()
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const active = useActiveSection()
  const home = pathname === '/'

  // Tuck away while reading downward, come back the moment the user scrolls up.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 24)
    if (y < 140) setHidden(false)
    else if (y > prev + 4) setHidden(true)
    else if (y < prev - 4) setHidden(false)
  })

  return (
    <motion.header
      className={`glass fixed inset-x-0 top-0 z-50 h-[60px] border-b transition-[border-color] duration-500 ${scrolled ? 'border-line' : 'border-transparent'}`}
      initial={{ y: '-100%' }}
      animate={{ y: !heroReady ? '-100%' : hidden ? '-100%' : 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      {home && <ScrollProgress />}
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" aria-label="Orbit home">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const on = home && active === l.id
            return (
              <Link key={l.id} to={`/#${l.id}`} className={`relative rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors duration-300 ${on ? 'text-ink' : 'text-ink-soft hover:text-ink'}`}>
                {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-card-alt" transition={SPRING_SOFT} />}
                <span className="relative">{l.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Magnetic>
            <Button to="/#upload" size="sm">
              Upload data
            </Button>
          </Magnetic>
        </div>
      </div>
    </motion.header>
  )
}
