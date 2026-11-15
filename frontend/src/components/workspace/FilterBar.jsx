import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, FilterX, Search } from 'lucide-react'
import { effectiveRange, hasDates, rangePresets } from '../../lib/cube.js'
import { fmtInt, fmtIso, isoToDay } from '../../lib/fmt.js'

const sameRange = (a, b) => (a == null && b == null) || (a && b && a[0] === b[0] && a[1] === b[1])

function DimFilter({ dim, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const options = useMemo(() => {
    const counts = new Int32Array(dim.dict.length)
    for (let i = 0; i < dim.codes.length; i++) if (dim.codes[i] >= 0) counts[dim.codes[i]]++
    return dim.dict.map((name, code) => ({ code, name, count: counts[code] })).sort((a, b) => b.count - a.count)
  }, [dim])

  const shown = q ? options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase())) : options
  const n = selected?.size ?? 0

  function toggle(code) {
    const next = new Set(selected ?? [])
    if (next.has(code)) next.delete(code)
    else next.add(code)
    onChange(next)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${n ? 'border-accent bg-accent-soft text-accent-dark' : 'border-line bg-card text-ink-soft hover:border-line-strong hover:text-ink'}`}
      >
        {dim.name}
        {n > 0 && <span className="rounded-full bg-accent px-1.5 text-[10.5px] font-semibold text-white">{n}</span>}
        <ChevronDown size={13} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-64 rounded-xl border border-line-strong bg-card p-2 shadow-card-lg">
          {options.length > 9 && (
            <label className="mb-1.5 flex items-center gap-2 rounded-lg border border-line bg-card-alt px-2.5 py-1.5">
              <Search size={13} className="text-ink-faint" aria-hidden="true" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${dim.name.toLowerCase()}…`} className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-faint" />
            </label>
          )}
          <ul className="scroll-thin max-h-60 overflow-y-auto">
            {shown.map((o) => {
              const on = selected?.has(o.code)
              return (
                <li key={o.code}>
                  <button type="button" onClick={() => toggle(o.code)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-card-alt">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-accent bg-accent text-white' : 'border-line-strong'}`}>{on && <Check size={11} strokeWidth={3} />}</span>
                    <span className="min-w-0 flex-1 truncate text-ink">{o.name}</span>
                    <span className="text-[11px] text-ink-faint tabular">{fmtInt(o.count)}</span>
                  </button>
                </li>
              )
            })}
            {shown.length === 0 && <li className="px-2 py-3 text-center text-[12px] text-ink-faint">No matches</li>}
          </ul>
          {n > 0 && (
            <button type="button" onClick={() => onChange(new Set())} className="mt-1.5 w-full rounded-md border-t border-line px-2 pt-2 text-left text-[12px] font-medium text-accent-dark hover:underline">
              Clear {dim.name}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function FilterBar({ cube, filters, onChange, rowCount }) {
  const barRef = useRef(null)
  // Publish the bar's height so the sticky sidebar / insights rail can sit
  // right beneath it, however many rows the filters wrap onto.
  useLayoutEffect(() => {
    const el = barRef.current
    if (!el) return undefined
    const set = () => document.documentElement.style.setProperty('--filter-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const presets = rangePresets(cube)
  const range = effectiveRange(cube, filters)
  const activePreset = presets.find((p) => sameRange(p.range, filters.range ?? null))
  const nDimFilters = Object.values(filters.dims).filter((s) => s && s.size).length
  const dirty = nDimFilters > 0

  function setRange(r) {
    onChange({ ...filters, range: r })
  }
  function setDim(name, set) {
    const dims = { ...filters.dims }
    if (set.size) dims[name] = set
    else delete dims[name]
    onChange({ ...filters, dims })
  }

  return (
    <div ref={barRef} className="glass relative z-30 border-b border-line md:sticky md:top-14">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6">
        {hasDates(cube) && (
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Date range" className="inline-flex items-center gap-0.5 rounded-full border border-line bg-card p-0.5">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={activePreset?.id === p.id}
                  onClick={() => setRange(p.range)}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${activePreset?.id === p.id ? 'bg-ink text-paper' : 'text-ink-faint hover:text-ink'}`}
                >
                  {p.label}
                </button>
              ))}
              {!activePreset && <span className="rounded-full bg-ink px-2.5 py-1 text-[12px] font-medium text-paper">Custom</span>}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-ink-faint">
              <input
                type="date"
                aria-label="From date"
                min={fmtIso(cube.dateMin)}
                max={fmtIso(range[1])}
                value={fmtIso(range[0])}
                onChange={(e) => {
                  const d = isoToDay(e.target.value)
                  if (d != null) setRange([d, range[1]])
                }}
                className="rounded-md border border-line bg-card px-2 py-1 text-[12px] text-ink [color-scheme:inherit]"
              />
              <span aria-hidden="true">→</span>
              <input
                type="date"
                aria-label="To date"
                min={fmtIso(range[0])}
                max={fmtIso(cube.dateMax)}
                value={fmtIso(range[1])}
                onChange={(e) => {
                  const d = isoToDay(e.target.value)
                  if (d != null) setRange([range[0], d])
                }}
                className="rounded-md border border-line bg-card px-2 py-1 text-[12px] text-ink [color-scheme:inherit]"
              />
            </div>
            <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {cube.dimensions.slice(0, 8).map((d) => (
            <DimFilter key={d.name} dim={d} selected={filters.dims[d.name]} onChange={(set) => setDim(d.name, set)} />
          ))}
          {dirty && (
            <button type="button" onClick={() => onChange({ ...filters, dims: {} })} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12.5px] font-medium text-negative hover:bg-negative/10">
              <FilterX size={13} aria-hidden="true" /> Clear
            </button>
          )}
        </div>

        <p className="ml-auto text-[12px] text-ink-faint tabular" aria-live="polite">
          <span className="font-semibold text-ink">{fmtInt(rowCount)}</span> of {fmtInt(cube.n)} rows
          {cube.sampled && <span title={`The file has ${fmtInt(cube.totalRows)} rows; the dashboard uses an even sample of ${fmtInt(cube.n)}.`}> · sampled</span>}
        </p>
      </div>
    </div>
  )
}
