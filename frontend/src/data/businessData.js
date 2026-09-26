// Hand-tuned synthetic dataset for the public demo. Every number below is
// internally consistent — chart series, KPI cards and AI narrative all read
// from these same constants, so nothing can drift out of sync. The backend's
// Postgres seed script generates a larger, independently-computed dataset
// with the same underlying story (see backend/database/seed.py).

const MONTH_LABELS_CYCLE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SEASONALITY = [1.02, 0.98, 1.0, 1.0, 0.99, 0.94, 0.92, 0.93, 1.03, 1.12, 1.15, 1.08]

function pseudoNoise(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

function buildMonthlyRevenue() {
  const months = []
  const startBase = 18.24 // Cr, solved so month 22 lands near ₹27.07 Cr
  for (let i = 0; i < 24; i++) {
    const calMonth = (7 + i) % 12 // index 0 = Aug
    const yearOffset = Math.floor((7 + i) / 12)
    const growth = Math.pow(1.021, i)
    const seasonal = SEASONALITY[calMonth]
    const noise = 1 + 0.015 * pseudoNoise(i)
    let revenue = startBase * growth * seasonal * noise
    if (i === 22) revenue = 27.07 // June 2026 — pre-decline baseline
    if (i === 23) revenue = 24.8 // July 2026 — the month under investigation
    const orders = Math.round(revenue * 743 * (1 + 0.01 * pseudoNoise(i + 50)))
    const margin = i === 23 ? 31.4 : i === 22 ? 32.1 : 30.6 + 1.4 * pseudoNoise(i + 100)
    months.push({
      month: `${MONTH_LABELS_CYCLE[calMonth]} '${String(24 + yearOffset).padStart(2, '0')}`,
      revenue: Math.round(revenue * 100) / 100,
      orders,
      margin: Math.round(margin * 10) / 10,
    })
  }
  return months
}

export const MONTHLY_REVENUE = buildMonthlyRevenue()
export const CURRENT_MONTH = MONTHLY_REVENUE[23]
export const PRIOR_MONTH = MONTHLY_REVENUE[22]
export const REVENUE_DECLINE_PCT = ((PRIOR_MONTH.revenue - CURRENT_MONTH.revenue) / PRIOR_MONTH.revenue) * 100

export const KPIS = {
  revenue: { value: 24.8, unit: 'cr', deltaPct: -REVENUE_DECLINE_PCT, label: 'Revenue' },
  orders: { value: 18452, unit: 'count', deltaPct: -5.4, label: 'Orders' },
  margin: { value: 31.4, unit: 'pct', deltaPct: -0.7, label: 'Gross Margin' },
  inventory: { value: 8.2, unit: 'cr', deltaPct: 3.1, label: 'Inventory' },
}

export const REGIONS = [
  { name: 'West', july: 7.49, june: 8.73, changePct: -14.2, changeCr: -1.24, target: 8.6, managerAttainment: 76 },
  { name: 'North', july: 5.1, june: 5.36, changePct: -4.9, changeCr: -0.26, target: 5.3, managerAttainment: 96 },
  { name: 'South', july: 4.85, june: 5.1, changePct: -4.9, changeCr: -0.25, target: 5.0, managerAttainment: 97 },
  { name: 'East', july: 3.68, june: 3.95, changePct: -6.8, changeCr: -0.27, target: 3.8, managerAttainment: 97 },
  { name: 'Central', july: 3.68, june: 3.93, changePct: -6.4, changeCr: -0.25, target: 3.75, managerAttainment: 98 },
]

export const CATEGORIES = [
  { name: 'Home Appliances', july: 5.46, june: 6.18, changePct: -11.7 },
  { name: 'Personal Care', july: 4.96, june: 5.28, changePct: -6.1 },
  { name: 'Packaged Foods', july: 4.71, june: 4.99, changePct: -5.6 },
  { name: 'Beverages', july: 3.72, june: 3.93, changePct: -5.3 },
  { name: 'Home & Kitchen', july: 3.47, june: 3.68, changePct: -5.7 },
  { name: 'Health & Wellness', july: 2.48, june: 3.01, changePct: -17.6 },
]

export const TOP_PRODUCTS = [
  { sku: 'HA-2201', name: 'AeroCool Tower Fan', category: 'Home Appliances', region: 'West', revenue: 0.62, changePct: -22.4, units: 3820, issue: 'Stock shortage' },
  { sku: 'HA-1148', name: 'ArcticBreeze Mini AC', category: 'Home Appliances', region: 'West', revenue: 0.58, changePct: -19.1, units: 1210, issue: 'Stock shortage' },
  { sku: 'HW-3390', name: 'PureGlow Water Purifier', category: 'Health & Wellness', region: 'South', revenue: 0.41, changePct: -15.8, units: 2640, issue: 'Price increase' },
  { sku: 'PC-0512', name: 'VelvetLeaf Hair Oil 500ml', category: 'Personal Care', region: 'North', revenue: 0.55, changePct: 9.8, units: 18420, issue: null },
  { sku: 'BV-1187', name: 'CitrusRush Sparkling 12-pack', category: 'Beverages', region: 'South', revenue: 0.47, changePct: 12.3, units: 26310, issue: null },
  { sku: 'HK-2075', name: 'ClearView Glass Storage Set', category: 'Home & Kitchen', region: 'East', revenue: 0.33, changePct: -8.9, units: 7420, issue: 'Slow moving' },
  { sku: 'PF-0788', name: 'HarvestGold Muesli 1kg', category: 'Packaged Foods', region: 'Central', revenue: 0.36, changePct: 6.2, units: 14980, issue: null },
  { sku: 'HA-2560', name: 'FrostLine Refrigerator 190L', category: 'Home Appliances', region: 'West', revenue: 0.29, changePct: -16.7, units: 640, issue: 'Stock shortage' },
]

export const SHORTAGE_SKU_COUNT = 12

export const INVENTORY = {
  totalValue: 8.2,
  slowMoving: 1.3,
  ageing90: 0.74,
  riskSkuCount: 18,
  ageingBuckets: [
    { bucket: '0–30 days', value: 4.8 },
    { bucket: '31–60 days', value: 1.7 },
    { bucket: '61–90 days', value: 0.96 },
    { bucket: '90+ days', value: 0.74 },
  ],
  byCategory: [
    { name: 'Home Appliances', value: 2.1 },
    { name: 'Packaged Foods', value: 1.6 },
    { name: 'Personal Care', value: 1.5 },
    { name: 'Home & Kitchen', value: 1.3 },
    { name: 'Beverages', value: 0.9 },
    { name: 'Health & Wellness', value: 0.8 },
  ],
  riskTable: [
    { sku: 'HA-2560', name: 'FrostLine Refrigerator 190L', region: 'West', daysAgeing: 142, value: 0.18, risk: 'High', action: 'Discount to clear' },
    { sku: 'HW-3390', name: 'PureGlow Water Purifier', region: 'South', daysAgeing: 118, value: 0.14, risk: 'High', action: 'Reduce reorder qty' },
    { sku: 'HA-1148', name: 'ArcticBreeze Mini AC', region: 'West', daysAgeing: 96, value: 0.11, risk: 'Medium', action: 'Bundle promotion' },
    { sku: 'HK-2075', name: 'ClearView Glass Storage Set', region: 'East', daysAgeing: 104, value: 0.09, risk: 'Medium', action: 'Discount to clear' },
    { sku: 'PF-0331', name: 'GoldenCrisp Snack Mix 250g', region: 'Central', daysAgeing: 88, value: 0.07, risk: 'Medium', action: 'Reduce reorder qty' },
    { sku: 'BV-0940', name: 'MorningBrew Filter Coffee 200g', region: 'North', daysAgeing: 91, value: 0.06, risk: 'Low', action: 'Monitor' },
  ],
}

export const SALES_MANAGERS = [
  { name: 'Karan Mehta', region: 'West', target: 8.6, actual: 6.54, attainment: 76 },
  { name: 'Ishaan Kapoor', region: 'West', target: 4.2, actual: 3.71, attainment: 88 },
  { name: 'Ritu Chawla', region: 'North', target: 5.3, actual: 5.09, attainment: 96 },
  { name: 'Sanjay Iyer', region: 'South', target: 5.0, actual: 4.86, attainment: 97 },
  { name: 'Priya Nair', region: 'South', target: 3.4, actual: 3.35, attainment: 98 },
  { name: 'Arjun Bhatia', region: 'East', target: 3.8, actual: 3.69, attainment: 97 },
  { name: 'Meera Krishnan', region: 'Central', target: 3.75, actual: 3.68, attainment: 98 },
  { name: 'Devansh Rao', region: 'North', target: 3.1, actual: 3.06, attainment: 99 },
]

export const WEEKLY_INSIGHT = {
  revenueChangePct: 6.8,
  decliningRegion: 'West',
  decliningRegionChangePct: -9.2,
  contributingProducts: 3,
  contributingShare: 71,
}

export const BIGGEST_RISKS = [
  { title: 'West region concentration', detail: 'West is 30% of revenue and just fell 14.2% in a single month — the single largest swing factor in the business.', severity: 'High' },
  { title: 'Home Appliances stock shortages', detail: `${SHORTAGE_SKU_COUNT} high-volume SKUs were out of stock for part of July, directly costing sales.`, severity: 'High' },
  { title: 'Ageing inventory', detail: `₹74 L of stock is aged 90+ days; 7 SKUs account for 62% of that value and are becoming harder to sell at full price.`, severity: 'Medium' },
  { title: 'Health & Wellness pricing', detail: 'A price increase on PureGlow Water Purifier coincided with a 17.6% category revenue decline.', severity: 'Medium' },
]

export const REORDER_RECOMMENDATIONS = TOP_PRODUCTS.filter((p) => p.issue === 'Stock shortage').map((p) => ({
  ...p,
  recommendedUnits: Math.round(p.units * 0.35),
}))
