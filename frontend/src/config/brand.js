// Single source of truth for brand identity. Change BRAND_NAME here (or set
// VITE_BRAND_NAME at build time) to re-skin the entire site with no other
// code changes.
export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'Orbit'
export const BRAND_TAGLINE = 'AI Business Analyst'
export const BRAND_DESCRIPTION =
  'AI-powered business intelligence that helps you understand what happened, why it happened, and what to do next.'

// The person behind Orbit — shown in the About section and the footer.
export const FOUNDER = {
  name: 'Mayank Rai',
  role: 'Founder',
  tagline: 'Building AI-powered Business Intelligence & Automation Products',
  stack: ['Data Engineering', 'AI', 'Python', 'SQL', 'FastAPI', 'React'],
  portfolio: 'https://mayank-rai.pages.dev',
  linkedin: 'https://www.linkedin.com/in/mayank-rai-08a363137/',
}

export const COMPANY = {
  legalName: `${BRAND_NAME} Technologies`,
  foundedYear: 2026,
  linkedin: FOUNDER.linkedin,
  email: 'hello@orbit.ai',
}
