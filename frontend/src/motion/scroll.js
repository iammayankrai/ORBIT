// A tiny bridge so any component can scroll to a target without caring
// whether inertial smooth-scroll (Lenis) is currently running.

let lenisInstance = null

export const setLenis = (instance) => {
  lenisInstance = instance
}
export const getLenis = () => lenisInstance

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function scrollToTarget(target, { offset = -72, immediate = false } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return false
  // An exact pixel position, not the element itself: Lenis (like the native
  // API) would otherwise also apply the section's CSS scroll-margin and
  // stop short of where we mean to land.
  const top = el.getBoundingClientRect().top + window.scrollY + offset
  if (lenisInstance) {
    lenisInstance.scrollTo(top, { immediate, duration: 1.35, easing: (t) => 1 - Math.pow(1 - t, 4) })
  } else {
    window.scrollTo({ top, behavior: immediate || reduced() ? 'auto' : 'smooth' })
  }
  return true
}

export function scrollToTop({ immediate = true } = {}) {
  if (lenisInstance) lenisInstance.scrollTo(0, { immediate })
  else window.scrollTo({ top: 0, behavior: 'auto' })
}
