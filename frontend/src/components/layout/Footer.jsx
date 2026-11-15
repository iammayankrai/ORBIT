import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { BRAND_NAME, FOUNDER } from '../../config/brand.js'
import { DEMOS } from '../../config/demos.js'
import { usePrefersReducedMotion } from '../../motion/hooks.js'
import { RevealGroup, RevealItem } from '../../motion/Reveal.jsx'
import { EASE_OUT } from '../../motion/tokens.js'
import { LinkedinIcon } from './BrandIcons.jsx'
import Logo from './Logo.jsx'

// The giant wordmark: each letter rises into place when the footer scrolls
// into view.
function Wordmark({ text }) {
  const reduced = usePrefersReducedMotion()
  return (
    <p aria-hidden="true" className="display pointer-events-none mt-16 flex select-none justify-center overflow-hidden pb-[0.08em] text-[clamp(80px,22vw,300px)] leading-[0.8] text-ink/[0.045]">
      {text.split('').map((ch, i) => (
        <motion.span key={i} className="inline-block" initial={reduced ? false : { y: '105%' }} whileInView={{ y: 0 }} viewport={{ once: true, margin: '0px 0px -5% 0px' }} transition={{ duration: 1.1, ease: EASE_OUT, delay: i * 0.07 }}>
          {ch}
        </motion.span>
      ))}
    </p>
  )
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-card md:sticky md:bottom-0 md:z-0">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8">
        <RevealGroup className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]" stagger={0.08}>
          <RevealItem y={28} scale={1}>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink-soft">Turn any spreadsheet into a dashboard you can actually explore — then ask it questions in plain English.</p>
            <a href={FOUNDER.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="mt-5 inline-flex rounded-full border border-line p-2 text-ink-soft transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:text-ink">
              <LinkedinIcon size={16} />
            </a>
          </RevealItem>
          <RevealItem y={28} scale={1}>
            <h3 className="eyebrow mb-4">Live demos</h3>
            <ul className="flex flex-col gap-2.5">
              {DEMOS.map((d) => (
                <li key={d.id}>
                  <Link to={`/dashboard?demo=${d.id}`} className="inline-block text-[14px] text-ink-soft transition-[color,transform] duration-300 hover:translate-x-1 hover:text-ink">
                    {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          </RevealItem>
          <RevealItem y={28} scale={1}>
            <h3 className="eyebrow mb-4">Product</h3>
            <ul className="flex flex-col gap-2.5 text-[14px] text-ink-soft">
              {[['Upload your data', '/#upload'], ['Capabilities', '/#capabilities'], ['How it works', '/#process'], ['FAQ', '/#faq']].map(([l, to]) => (
                <li key={to}>
                  <Link to={to} className="inline-block transition-[color,transform] duration-300 hover:translate-x-1 hover:text-ink">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </RevealItem>
          <RevealItem y={28} scale={1}>
            <h3 className="eyebrow mb-4">Built by</h3>
            <p className="text-[14px] font-medium text-ink">{FOUNDER.name}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{FOUNDER.tagline}</p>
            <a href={FOUNDER.portfolio} target="_blank" rel="noreferrer" className="group mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-accent-dark hover:underline">
              Portfolio <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </RevealItem>
        </RevealGroup>
        <Wordmark text={BRAND_NAME.toLowerCase()} />
        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-6 text-[12.5px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND_NAME}. Demo datasets are entirely synthetic.
          </p>
          <p className="font-mono text-[11.5px] uppercase tracking-wider">React · FastAPI · pandas</p>
        </div>
      </div>
    </footer>
  )
}
