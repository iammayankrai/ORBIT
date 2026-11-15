import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { SPRING_POP } from '../../motion/tokens.js'
import { useTheme } from '../../theme/ThemeProvider.jsx'

// The icon turns over as the page theme sweeps across behind it.
export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const Icon = theme === 'dark' ? Sun : Moon
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line text-ink-soft transition-[color,border-color,transform] duration-300 hover:border-line-strong hover:text-ink active:scale-90 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} initial={{ rotate: -90, scale: 0.4, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0.4, opacity: 0 }} transition={SPRING_POP} className="flex">
          <Icon size={16} aria-hidden="true" />
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
