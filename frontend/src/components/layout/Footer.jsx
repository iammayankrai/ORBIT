import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { BRAND_NAME, FOUNDER } from '../../config/brand.js'
import { DEMOS } from '../../config/demos.js'
import { LinkedinIcon } from './BrandIcons.jsx'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-card">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink-soft">Turn any spreadsheet into a dashboard you can actually explore — then ask it questions in plain English.</p>
            <a href={FOUNDER.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="mt-5 inline-flex rounded-full border border-line p-2 text-ink-soft transition-colors hover:border-line-strong hover:text-ink">
              <LinkedinIcon size={16} />
            </a>
          </div>
          <div>
            <h3 className="eyebrow mb-4">Live demos</h3>
            <ul className="flex flex-col gap-2.5">
              {DEMOS.map((d) => (
                <li key={d.id}>
                  <Link to={`/dashboard?demo=${d.id}`} className="text-[14px] text-ink-soft transition-colors hover:text-ink">
                    {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow mb-4">Product</h3>
            <ul className="flex flex-col gap-2.5 text-[14px] text-ink-soft">
              {[['Upload your data', '/#upload'], ['Capabilities', '/#capabilities'], ['How it works', '/#process'], ['FAQ', '/#faq']].map(([l, to]) => (
                <li key={to}>
                  <Link to={to} className="transition-colors hover:text-ink">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow mb-4">Built by</h3>
            <p className="text-[14px] font-medium text-ink">{FOUNDER.name}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{FOUNDER.tagline}</p>
            <a href={FOUNDER.portfolio} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-accent-dark hover:underline">
              Portfolio <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
        <p aria-hidden="true" className="display pointer-events-none mt-16 select-none text-center text-[clamp(80px,22vw,300px)] leading-[0.8] text-ink/[0.045]">
          {BRAND_NAME.toLowerCase()}
        </p>
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
