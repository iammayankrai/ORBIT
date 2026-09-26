// Single source of truth for brand identity. Change BRAND_NAME here (or set
// VITE_BRAND_NAME at build time) to re-skin the entire site with no other
// code changes.
export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'Orbit'
export const BRAND_TAGLINE = 'AI Business Analyst'
export const BRAND_DESCRIPTION =
  'AI-powered business intelligence that helps you understand what happened, why it happened, and what to do next.'

export const COMPANY = {
  legalName: `${BRAND_NAME} Technologies`,
  foundedYear: 2026,
  github: 'https://github.com/iammayankrai/orbit',
  linkedin: 'https://linkedin.com',
  email: 'hello@orbit.ai',
}
