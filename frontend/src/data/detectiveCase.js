// A self-contained mystery for the Data Detective feature. Deliberately a
// different scenario from the AI Analyst demo (different quarter, region and
// root cause) so the two features don't feel repetitive.

export const DETECTIVE_CASE = {
  title: 'The Q1 Revenue Drop',
  premise: 'Revenue fell 12% last quarter compared with the quarter before. Your job is to find out why — and prove it with data.',
  priorLabel: 'Q4 (Oct–Dec)',
  currentLabel: 'Q1 (Jan–Mar)',
  totalPrior: 82.5,
  totalCurrent: 72.6,
  declinePct: 12.0,
}

export const REGION_CLUES = [
  { region: 'North', prior: 16.1, current: 16.4, changePct: 1.9 },
  { region: 'South', prior: 22.6, current: 13.5, changePct: -40.3 },
  { region: 'East', prior: 14.9, current: 14.6, changePct: -2.0 },
  { region: 'West', prior: 15.3, current: 14.9, changePct: -2.6 },
  { region: 'Central', prior: 13.6, current: 13.2, changePct: -2.9 },
]

export const SOUTH_MONTHLY = [
  { month: 'Oct', revenue: 7.9 },
  { month: 'Nov', revenue: 7.5 },
  { month: 'Dec', revenue: 7.2 },
  { month: 'Jan', revenue: 7.6 },
  { month: 'Feb', revenue: 3.6 },
  { month: 'Mar', revenue: 2.3 },
]

export const SOUTH_CATEGORY_CLUES = [
  { category: 'Personal Care', prior: 9.8, current: 2.5, changePct: -74.5 },
  { category: 'Packaged Foods', prior: 5.1, current: 4.7, changePct: -7.8 },
  { category: 'Beverages', prior: 3.4, current: 3.2, changePct: -5.9 },
  { category: 'Home & Kitchen', prior: 2.6, current: 2.3, changePct: -11.5 },
  { category: 'Home Appliances', prior: 1.7, current: 0.8, changePct: -52.9 },
]

export const MANAGER_CLUES = [
  { name: 'Ananya Rao', territory: 'South-2', target: 6.5, actual: 2.1, attainment: 32 },
  { name: 'Vikram Singh', territory: 'South-1', target: 6.0, actual: 5.8, attainment: 97 },
]

export const PRICING_LOG = [
  { date: '4 Feb', change: 'Personal Care list price +18% in South-2 territory', category: 'Personal Care', region: 'South' },
  { date: '11 Feb', change: 'No corresponding price change in South-1 or any other region', category: 'Personal Care', region: 'South' },
]

export const CUSTOMER_CLUE = {
  account: 'Sundaram FreshMart Chain',
  region: 'South',
  territory: 'South-2',
  note: 'Previously South\'s largest Personal Care buyer. Order volume fell 68% starting in February, the same month the price change took effect.',
}

export const INVENTORY_CLUE = {
  note: 'South Personal Care stock levels stayed healthy all quarter — no stock-outs, no unusual ageing. Inventory can be ruled out as a cause.',
}

export const GROUND_TRUTH = {
  region: 'South',
  category: 'Personal Care',
  driver: 'price',
  manager: 'Ananya Rao',
  month: 'February',
}

export const DETECTIVE_TOOLS = ['Region', 'Product & Category', 'Customer', 'Month', 'Inventory', 'Sales Manager', 'Pricing']

const CASE_QA = [
  {
    test: /region/i,
    answer: 'South declined 40.3% quarter-over-quarter while every other region was roughly flat. South alone accounts for the vast majority of the total decline.',
  },
  {
    test: /product|categor/i,
    answer: 'Within South, Personal Care fell 74.5% — from ₹9.8 Cr to ₹2.5 Cr. Every other category in South declined only modestly, in line with the rest of the business.',
  },
  {
    test: /month|when|trend/i,
    answer: 'South revenue was stable through January, then dropped sharply in February and fell further in March. Whatever happened, it started in February.',
  },
  {
    test: /invent|stock/i,
    answer: 'South Personal Care inventory was healthy all quarter — no stock-outs, no ageing spike. Inventory is not the cause here.',
  },
  {
    test: /manager|target/i,
    answer: 'Ananya Rao (South-2) hit only 32% of target. Vikram Singh (South-1) hit 97%. The problem is concentrated in one territory, not all of South.',
  },
  {
    test: /pric/i,
    answer: 'South-2 raised Personal Care list prices 18% on 4 February — the same month the decline began. No other territory changed pricing.',
  },
  {
    test: /customer|account/i,
    answer: "South-2's largest Personal Care account, Sundaram FreshMart Chain, cut order volume 68% starting in February.",
  },
]

export function askDetective(question) {
  const hit = CASE_QA.find((qa) => qa.test.test(question))
  return hit ? hit.answer : "Try asking about region, category, month, inventory, sales manager, pricing or a specific customer account."
}

export function scoreConclusion(text) {
  const lower = text.toLowerCase()
  const checks = [
    { key: 'region', label: 'Identified South as the region', hit: lower.includes('south') },
    { key: 'category', label: 'Identified Personal Care as the category', hit: lower.includes('personal care') },
    { key: 'driver', label: 'Identified a price increase as the driver', hit: /price|pricing/.test(lower) },
    { key: 'month', label: 'Identified February as when it started', hit: lower.includes('feb') },
    { key: 'manager', label: 'Connected it to Ananya Rao / South-2', hit: lower.includes('ananya') || lower.includes('south-2') || lower.includes('south 2') },
  ]
  const matched = checks.filter((c) => c.hit)
  const missed = checks.filter((c) => !c.hit)
  const score = Math.round((matched.length / checks.length) * 100)
  const verdict = score >= 80 ? 'Case solved' : score >= 40 ? 'On the right track' : 'Keep investigating'
  return { score, matched, missed, verdict }
}

export const OFFICIAL_EXPLANATION =
  "South-2's territory manager, Ananya Rao, raised Personal Care list prices 18% on 4 February. South's largest Personal Care account, Sundaram FreshMart Chain, responded by cutting order volume 68%. Inventory was never a factor — stock stayed healthy throughout. The result: South Personal Care revenue fell 74.5%, and because South carried a disproportionate share of company revenue, that single territory's pricing decision explains the majority of the company-wide 12% decline."
