import { useState } from 'react'
import { CircleCheck } from 'lucide-react'
import {
  CUSTOMER_CLUE,
  DETECTIVE_CASE,
  DETECTIVE_TOOLS,
  INVENTORY_CLUE,
  MANAGER_CLUES,
  PRICING_LOG,
  REGION_CLUES,
  SOUTH_CATEGORY_CLUES,
  SOUTH_MONTHLY,
} from '../../data/detectiveCase.js'
import DumbbellChart from '../charts/DumbbellChart.jsx'
import RevenueTrendChart from '../charts/RevenueTrendChart.jsx'
import RankedBarChart from '../charts/RankedBarChart.jsx'

function RegionView() {
  return (
    <DumbbellChart
      data={REGION_CLUES}
      priorKey="prior"
      currentKey="current"
      nameKey="region"
      changeKey="changePct"
      priorLabel={DETECTIVE_CASE.priorLabel}
      currentLabel={DETECTIVE_CASE.currentLabel}
    />
  )
}

function ProductView() {
  return (
    <DumbbellChart
      data={SOUTH_CATEGORY_CLUES}
      priorKey="prior"
      currentKey="current"
      nameKey="category"
      changeKey="changePct"
      priorLabel={DETECTIVE_CASE.priorLabel}
      currentLabel={DETECTIVE_CASE.currentLabel}
    />
  )
}

function MonthView() {
  return (
    <div>
      <p className="mb-3 text-sm text-ink-faint">South region monthly revenue, ₹ Cr</p>
      <RevenueTrendChart data={SOUTH_MONTHLY} height={220} tickInterval={0} />
    </div>
  )
}

function ManagerView() {
  return <RankedBarChart data={MANAGER_CLUES} nameKey="name" valueKey="attainment" suffix="%" />
}

function InventoryView() {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
      <CircleCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{INVENTORY_CLUE.note}</p>
    </div>
  )
}

function PricingView() {
  return (
    <ul className="flex flex-col gap-3">
      {PRICING_LOG.map((entry) => (
        <li key={entry.date} className="rounded-xl border border-border px-4 py-3">
          <p className="text-xs font-medium text-ink-faint">{entry.date}</p>
          <p className="mt-1 text-sm text-ink">{entry.change}</p>
        </li>
      ))}
    </ul>
  )
}

function CustomerView() {
  return (
    <div className="rounded-xl border border-border px-4 py-4">
      <p className="text-sm font-semibold text-ink">
        {CUSTOMER_CLUE.account} <span className="font-normal text-ink-faint">· {CUSTOMER_CLUE.territory}</span>
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{CUSTOMER_CLUE.note}</p>
    </div>
  )
}

const VIEWS = {
  Region: RegionView,
  'Product & Category': ProductView,
  Customer: CustomerView,
  Month: MonthView,
  Inventory: InventoryView,
  'Sales Manager': ManagerView,
  Pricing: PricingView,
}

export default function InvestigationPanel() {
  const [active, setActive] = useState(DETECTIVE_TOOLS[0])
  const ActiveView = VIEWS[active]

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Investigation tools">
        {DETECTIVE_TOOLS.map((tool) => (
          <button
            key={tool}
            role="tab"
            type="button"
            aria-selected={active === tool}
            onClick={() => setActive(tool)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active === tool ? 'bg-ink text-white' : 'bg-surface-alt text-ink-soft hover:text-ink'
            }`}
          >
            {tool}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        <ActiveView />
      </div>
    </div>
  )
}
