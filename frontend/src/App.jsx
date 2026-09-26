import { Suspense, lazy, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Navbar from './components/layout/Navbar.jsx'
import Footer from './components/layout/Footer.jsx'
import ScrollToHash from './components/layout/ScrollToHash.jsx'
import PageLoader from './components/ui/PageLoader.jsx'
import AboutModal from './components/sections/AboutModal.jsx'
import Home from './pages/Home.jsx'

const NotFound = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ScrollToHash />
        <div className="flex min-h-screen flex-col">
          <Navbar onOpenAbout={() => setAboutOpen(true)} />
          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer onOpenAbout={() => setAboutOpen(true)} />
        </div>
        <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      </BrowserRouter>
    </MotionConfig>
  )
}
