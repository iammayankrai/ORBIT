import {
  BIGGEST_RISKS,
  CATEGORIES,
  CURRENT_MONTH,
  INVENTORY,
  MONTHLY_REVENUE,
  PRIOR_MONTH,
  REGIONS,
  REORDER_RECOMMENDATIONS,
  REVENUE_DECLINE_PCT,
  SALES_MANAGERS,
  SHORTAGE_SKU_COUNT,
  TOP_PRODUCTS,
} from './businessData.js'
import { inr, pct } from '../utils/format.js'

export const SUGGESTED_QUESTIONS = [
  'Why did sales decline?',
  'Show top performing regions',
  'Find inventory risks',
  'Which products need attention?',
  'Compare this month with last year',
]

const JULY_LAST_YEAR = MONTHLY_REVENUE[11].revenue
const YOY_CHANGE_PCT = ((CURRENT_MONTH.revenue - JULY_LAST_YEAR) / JULY_LAST_YEAR) * 100

const INTENTS = [
  {
    id: 'revenue_decline',
    test: /declin|drop|fell|fall|decreas|why.*revenue|q2|quarter/i,
    build: () => ({
      answer: `Revenue declined ${pct(REVENUE_DECLINE_PCT, { decimals: 1 })} compared with June, from ${inr(PRIOR_MONTH.revenue)} to ${inr(CURRENT_MONTH.revenue)}.`,
      metrics: [
        { label: 'June revenue', value: inr(PRIOR_MONTH.revenue) },
        { label: 'July revenue', value: inr(CURRENT_MONTH.revenue) },
        { label: 'Change', value: pct(-REVENUE_DECLINE_PCT, { signed: true }) },
      ],
      drivers: [
        { label: 'West region', value: `${pct(REGIONS[0].changePct)} · ${inr(REGIONS[0].changeCr)}`, impact: 'primary' },
        { label: 'Home Appliances category', value: pct(CATEGORIES[0].changePct), impact: 'secondary' },
        { label: `${SHORTAGE_SKU_COUNT} SKUs out of stock`, value: 'part of July', impact: 'secondary' },
      ],
      chart: { type: 'dumbbell', data: REGIONS },
      recommendation: 'Investigate the decline in West-region appliance sales and review inventory availability for the affected SKUs.',
      sql: `SELECT region, SUM(revenue) AS revenue\nFROM sales\nWHERE order_date BETWEEN '2026-06-01' AND '2026-07-31'\nGROUP BY region, date_trunc('month', order_date)\nORDER BY region;`,
    }),
  },
  {
    id: 'top_regions',
    test: /top.*region|best.*region|region.*perform|which region/i,
    build: () => {
      const ranked = [...REGIONS].sort((a, b) => b.managerAttainment - a.managerAttainment)
      return {
        answer: `${ranked[0].name} and ${ranked[1].name} are performing best this month, tracking at ${ranked[0].managerAttainment}–${ranked[1].managerAttainment}% of target while ${ranked[ranked.length - 1].name} trails at ${ranked[ranked.length - 1].managerAttainment}%.`,
        metrics: ranked.slice(0, 3).map((r) => ({ label: r.name, value: `${r.managerAttainment}% of target` })),
        drivers: ranked.slice(0, 3).map((r) => ({ label: r.name, value: inr(r.july), impact: 'positive' })),
        chart: { type: 'bars-horizontal', data: ranked, nameKey: 'name', valueKey: 'managerAttainment', suffix: '%' },
        recommendation: `Study what ${ranked[0].name} and ${ranked[1].name} are doing differently — pricing discipline and stock availability are the likely difference-makers versus ${ranked[ranked.length - 1].name}.`,
        sql: `SELECT region, SUM(actual) / SUM(target) * 100 AS attainment_pct\nFROM sales_targets\nWHERE period = '2026-07'\nGROUP BY region\nORDER BY attainment_pct DESC;`,
      }
    },
  },
  {
    id: 'inventory_risk',
    test: /inventory|ageing|aging|stock risk|slow.moving/i,
    build: () => ({
      answer: `${INVENTORY.riskSkuCount} SKUs are showing elevated inventory risk. 7 of them account for 62% of ageing inventory value.`,
      metrics: [
        { label: 'Inventory value', value: inr(INVENTORY.totalValue) },
        { label: 'Ageing 90+ days', value: inr(INVENTORY.ageing90) },
        { label: 'At-risk SKUs', value: `${INVENTORY.riskSkuCount}` },
      ],
      drivers: INVENTORY.riskTable.slice(0, 3).map((r) => ({ label: r.name, value: `${r.daysAgeing} days · ${inr(r.value)}`, impact: 'negative' })),
      chart: { type: 'columns', data: INVENTORY.ageingBuckets, nameKey: 'bucket', valueKey: 'value' },
      recommendation: 'Discount or bundle the highest-ageing SKUs in West and South before their value erodes further.',
      sql: `SELECT sku, name, DATE_PART('day', NOW() - received_date) AS days_ageing, value\nFROM inventory\nWHERE DATE_PART('day', NOW() - received_date) > 90\nORDER BY value DESC;`,
    }),
  },
  {
    id: 'declining_products',
    test: /product.*(attention|declin)|which products|declining sales/i,
    build: () => {
      const declining = TOP_PRODUCTS.filter((p) => p.changePct < 0).sort((a, b) => a.changePct - b.changePct)
      return {
        answer: `${declining.length} products need attention — all Home Appliances or Health & Wellness, and mostly concentrated in West.`,
        metrics: declining.slice(0, 3).map((p) => ({ label: p.name, value: pct(p.changePct, { signed: true }) })),
        drivers: declining.slice(0, 3).map((p) => ({ label: p.name, value: p.issue || 'Declining', impact: 'negative' })),
        chart: { type: 'bars-horizontal', data: declining, nameKey: 'name', valueKey: 'changePct', suffix: '%' },
        recommendation: 'Reorder stock for the shortage-driven SKUs first — that is the fastest lever to recover lost revenue.',
        sql: `SELECT sku, name, category, region, revenue_change_pct\nFROM product_performance\nWHERE period = '2026-07' AND revenue_change_pct < 0\nORDER BY revenue_change_pct ASC;`,
      }
    },
  },
  {
    id: 'compare_yoy',
    test: /last year|year.over.year|yoy|annual/i,
    build: () => ({
      answer: `Revenue is ${pct(YOY_CHANGE_PCT, { signed: true })} versus July last year (${inr(JULY_LAST_YEAR)} → ${inr(CURRENT_MONTH.revenue)}), even after this month's dip.`,
      metrics: [
        { label: 'July last year', value: inr(JULY_LAST_YEAR) },
        { label: 'July this year', value: inr(CURRENT_MONTH.revenue) },
        { label: 'YoY change', value: pct(YOY_CHANGE_PCT, { signed: true }) },
      ],
      drivers: [{ label: 'Underlying demand trend', value: 'Healthy, up double digits YoY', impact: 'positive' }],
      chart: { type: 'trend', data: MONTHLY_REVENUE, xKey: 'month', yKey: 'revenue' },
      recommendation: "Treat July's dip as a regional and stock-availability issue to fix — not a sign of weaker overall demand.",
      sql: `SELECT date_trunc('month', order_date) AS month, SUM(revenue) AS revenue\nFROM sales\nWHERE order_date >= NOW() - INTERVAL '24 months'\nGROUP BY 1 ORDER BY 1;`,
    }),
  },
  {
    id: 'sales_manager',
    test: /manager|missed target|target/i,
    build: () => {
      const worst = [...SALES_MANAGERS].sort((a, b) => a.attainment - b.attainment)
      return {
        answer: `${worst[0].name} (${worst[0].region}) missed target by the widest margin — ${worst[0].attainment}% attainment against a ${inr(worst[0].target)} target.`,
        metrics: worst.slice(0, 3).map((m) => ({ label: m.name, value: `${m.attainment}%` })),
        drivers: worst.slice(0, 3).map((m) => ({ label: `${m.name} · ${m.region}`, value: `${inr(m.actual)} of ${inr(m.target)}`, impact: 'negative' })),
        chart: { type: 'bars-horizontal', data: worst, nameKey: 'name', valueKey: 'attainment', suffix: '%' },
        recommendation: `Review West's account coverage and stock allocation with ${worst[0].name} before next month's target-setting.`,
        sql: `SELECT sm.name, sm.region, st.target, st.actual, (st.actual / st.target * 100) AS attainment_pct\nFROM sales_managers sm JOIN sales_targets st ON st.manager_id = sm.id\nWHERE st.period = '2026-07'\nORDER BY attainment_pct ASC;`,
      }
    },
  },
  {
    id: 'reorder',
    test: /reorder|restock|replenish/i,
    build: () => ({
      answer: `${REORDER_RECOMMENDATIONS.length} SKUs need immediate reordering — all experienced stock-outs during a month of otherwise steady demand.`,
      metrics: REORDER_RECOMMENDATIONS.map((p) => ({ label: p.name, value: `+${p.recommendedUnits.toLocaleString('en-IN')} units` })),
      drivers: REORDER_RECOMMENDATIONS.map((p) => ({ label: p.name, value: pct(p.changePct, { signed: true }), impact: 'negative' })),
      chart: { type: 'bars-horizontal', data: REORDER_RECOMMENDATIONS, nameKey: 'name', valueKey: 'recommendedUnits' },
      recommendation: 'Prioritise the Home Appliances SKUs in West first — together they make up most of this month\'s shortage-driven shortfall.',
      sql: `SELECT sku, name, on_hand, reorder_point, suggested_qty\nFROM inventory_reorder_view\nWHERE on_hand < reorder_point\nORDER BY suggested_qty DESC;`,
    }),
  },
  {
    id: 'biggest_risks',
    test: /biggest risk|business risk|risks?/i,
    build: () => ({
      answer: `${BIGGEST_RISKS.length} risk areas need attention this month, ranked by potential business impact.`,
      metrics: BIGGEST_RISKS.map((r) => ({ label: r.title, value: r.severity })),
      drivers: BIGGEST_RISKS.map((r) => ({ label: r.title, value: r.detail, impact: r.severity === 'High' ? 'negative' : 'secondary' })),
      chart: { type: 'none' },
      recommendation: 'Start with West region concentration and appliance stock shortages — they are compounding each other.',
      sql: null,
    }),
  },
]

const FALLBACK = {
  answer:
    "I can help with revenue, regions, products, inventory and sales targets. Try one of the suggested questions, or ask about a specific region, product or month.",
  metrics: [],
  drivers: [],
  chart: { type: 'none' },
  recommendation: null,
  sql: null,
}

export function getDemoAIResponse(question) {
  const intent = INTENTS.find((i) => i.test.test(question))
  const payload = intent ? intent.build() : { ...FALLBACK }
  return { question, intent: intent?.id ?? 'fallback', ...payload }
}
