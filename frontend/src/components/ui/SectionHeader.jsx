import RevealOnScroll from './RevealOnScroll.jsx'

export default function SectionHeader({ eyebrow, title, description, align = 'center', className = '' }) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left'
  return (
    <RevealOnScroll className={`flex max-w-2xl flex-col gap-4 ${alignment} ${className}`}>
      {eyebrow && (
        <span className="text-sm font-semibold uppercase tracking-wide text-accent">{eyebrow}</span>
      )}
      <h2 className="text-balance text-[32px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[40px] lg:text-[48px]">
        {title}
      </h2>
      {description && (
        <p className="text-balance text-lg leading-relaxed text-ink-soft">{description}</p>
      )}
    </RevealOnScroll>
  )
}
