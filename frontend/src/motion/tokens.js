// Orbit's motion language. One easing family, a small set of durations, used
// everywhere - that consistency is most of what makes motion feel "designed".
//
//  EASE_OUT     expo-out. Fast start, long soft landing. Everything that
//               *appears* (text, cards, sections) uses it.
//  EASE_IN_OUT  Things that travel across the screen (curtains, wipes).
//  SPRING_POP   A little overshoot for small things that "pop" (chips, icons).
//  SPRING_SOFT  Pointer-follow smoothing (magnetic buttons, tilt).

export const EASE_OUT = [0.16, 1, 0.3, 1]
export const EASE_IN_OUT = [0.65, 0, 0.35, 1]

export const SPRING_POP = { type: 'spring', stiffness: 420, damping: 15, mass: 0.8 }
export const SPRING_SOFT = { type: 'spring', stiffness: 170, damping: 20, mass: 0.5 }

export const DUR = { fast: 0.3, base: 0.6, slow: 0.9, hero: 1.1 }
export const STAGGER = { words: 0.055, items: 0.07, cards: 0.08 }

// How far into the viewport an element must be before a once-only reveal fires.
export const VIEWPORT = { once: true, margin: '0px 0px -12% 0px' }

// Route curtain timings (ms) - cover, then reveal.
export const CURTAIN = { cover: 440, reveal: 560 }
