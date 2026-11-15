import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig, motion } from 'framer-motion'
import Footer from './components/layout/Footer.jsx'
import Navbar from './components/layout/Navbar.jsx'
import PageLoader from './components/ui/PageLoader.jsx'
import Intro from './motion/Intro.jsx'
import { MotionProvider } from './motion/MotionProvider.jsx'
import OrbitMark from './motion/OrbitMark.jsx'
import SmoothScroll from './motion/SmoothScroll.jsx'
import { usePrefersReducedMotion } from './motion/hooks.js'
import { scrollToTarget, scrollToTop } from './motion/scroll.js'
import { CURTAIN, EASE_IN_OUT, EASE_OUT } from './motion/tokens.js'
import { DatasetProvider } from './state/DatasetContext.jsx'
import { ThemeProvider } from './theme/ThemeProvider.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Workspace = lazy(() => import('./pages/Workspace.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

// Scrolls to the top on a new page and to the target on a #hash - using the
// smooth-scroll engine when it is running. Retries briefly because the page
// behind a lazy route may not have rendered yet.
function ScrollManager({ location }) {
  const first = useRef(true)
  useEffect(() => {
    const { hash } = location
    let timer
    if (hash) {
      let tries = 0
      const attempt = () => {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)))
        if (el) scrollToTarget(el, { immediate: first.current })
        else if (tries++ < 60) timer = setTimeout(attempt, 50)
      }
      attempt()
    } else {
      scrollToTop()
    }
    first.current = false
    return () => clearTimeout(timer)
  }, [location.pathname, location.hash]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

const CURTAIN_VARIANTS = {
  idle: { clipPath: 'inset(100% 0 0 0)', transition: { duration: 0 } },
  covering: { clipPath: 'inset(0% 0 0 0)', transition: { duration: CURTAIN.cover / 1000, ease: EASE_IN_OUT } },
  revealing: { clipPath: 'inset(0 0 100% 0)', transition: { duration: CURTAIN.reveal / 1000, ease: EASE_IN_OUT } },
}

// Owns page changes. When the *path* changes, an accent curtain sweeps up
// over the old page, the route underneath is swapped while it is fully
// covered, and the curtain lifts away on the new page. Same-path changes
// (hash links) swap straight away.
function AppShell() {
  const location = useLocation()
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = useState(location)
  const [phase, setPhase] = useState('idle')
  // False until the first route change, so the very first page doesn't also
  // play a page-enter animation on top of the intro / hero choreography.
  const [navigated, setNavigated] = useState(false)

  useEffect(() => {
    if (location === shown) return undefined
    if (reduced || location.pathname === shown.pathname) {
      setShown(location)
      setNavigated(true)
      return undefined
    }
    setPhase('covering')
    const t = setTimeout(() => {
      setShown(location)
      setNavigated(true)
      setPhase('revealing')
    }, CURTAIN.cover)
    return () => clearTimeout(t)
  }, [location, shown, reduced])

  useEffect(() => {
    if (phase !== 'revealing') return undefined
    const t = setTimeout(() => setPhase('idle'), CURTAIN.reveal)
    return () => clearTimeout(t)
  }, [phase])

  const app = shown.pathname.startsWith('/dashboard')

  return (
    <div className="relative">
      <ScrollManager location={shown} />
      <SmoothScroll pathname={shown.pathname} />
      {!app && <Navbar />}
      <main className={`relative z-10 bg-paper ${app ? '' : 'md:rounded-b-[2.5rem] md:shadow-[0_40px_70px_-30px_rgb(0_0_0/0.45)]'}`}>
        <motion.div key={shown.pathname} initial={navigated ? { opacity: 0, y: 28 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 }}>
          <Suspense fallback={<PageLoader />}>
            <Routes location={shown}>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Workspace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </main>
      {!app && <Footer />}

      <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-accent" variants={CURTAIN_VARIANTS} initial="idle" animate={phase}>
        <OrbitMark size={96} mode="loop" tone="light" />
      </motion.div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <MotionProvider>
        <DatasetProvider>
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <AppShell />
              <Intro />
            </BrowserRouter>
          </MotionConfig>
        </DatasetProvider>
      </MotionProvider>
    </ThemeProvider>
  )
}
