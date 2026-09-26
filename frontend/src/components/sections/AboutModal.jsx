import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, X } from 'lucide-react'
import founderPhoto from '../../assets/mayank-rai.jpg'
import { LinkedinIcon } from '../layout/BrandIcons.jsx'
import { FOUNDER } from '../../config/brand.js'
import Button from '../ui/Button.jsx'

// Rendered once at the app root and opened on demand (Navbar/Footer "About"
// click) rather than living in the page's scroll flow — a visitor scrolling
// the homepage never sees it unless they ask for it.
export default function AboutModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-3xl border border-border bg-white p-7 shadow-card-lg sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center gap-4 text-center">
              <img
                src={founderPhoto}
                alt={FOUNDER.name}
                className="h-20 w-20 rounded-full border border-border object-cover shadow-card"
              />
              <div>
                <h2 id="about-modal-title" className="text-xl font-semibold text-ink">
                  {FOUNDER.name}
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {FOUNDER.role} — {FOUNDER.tagline}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {FOUNDER.stack.map((item) => (
                  <span key={item} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-ink-faint">
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-1">
                <Button href={FOUNDER.portfolio} variant="secondary" size="md">
                  View Portfolio <ArrowUpRight size={15} aria-hidden="true" />
                </Button>
                <Button href={FOUNDER.linkedin} variant="ghost" size="md" className="border border-border">
                  <LinkedinIcon size={15} /> Connect on LinkedIn
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
