import { LinkedinIcon } from './BrandIcons.jsx'
import Logo from './Logo.jsx'
import { BRAND_NAME, COMPANY, FOUNDER } from '../../config/brand.js'
import Container from '../ui/Container.jsx'

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Upload your data', href: '#upload' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Sample insights', href: '#results' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Contact', href: `mailto:${COMPANY.email}` },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-surface-dark text-white">
      <Container className="py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-2">
            <Logo dark />
            <p className="max-w-xs text-sm leading-relaxed text-white/50">
              Upload an Excel or CSV file and turn raw business data into dashboards, insights and clear answers — in
              seconds.
            </p>
            {COMPANY.linkedin && (
              <div className="flex items-center gap-3 pt-1">
                <a
                  href={COMPANY.linkedin}
                  aria-label="LinkedIn"
                  className="rounded-full border border-white/15 p-2 text-white/60 transition-colors hover:border-white/30 hover:text-white"
                >
                  <LinkedinIcon size={16} />
                </a>
              </div>
            )}
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-white">{col.heading}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/50 transition-colors hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-white/10 pt-8 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COMPANY.foundedYear} {BRAND_NAME}. All rights reserved.
          </p>
          <p>
            Designed and built by <span className="text-white/70">{FOUNDER.name}</span>.
          </p>
        </div>
      </Container>
    </footer>
  )
}
