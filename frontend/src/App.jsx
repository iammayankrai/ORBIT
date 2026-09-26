import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Navbar from './components/layout/Navbar.jsx'
import Footer from './components/layout/Footer.jsx'
import ScrollToHash from './components/layout/ScrollToHash.jsx'
import PageLoader from './components/ui/PageLoader.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Analyst = lazy(() => import('./pages/Analyst.jsx'))
const DataDetective = lazy(() => import('./pages/DataDetective.jsx'))
const Inventory = lazy(() => import('./pages/Inventory.jsx'))
const Demo = lazy(() => import('./pages/Demo.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ScrollToHash />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/analyst" element={<Analyst />} />
                <Route path="/data-detective" element={<DataDetective />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </MotionConfig>
  )
}
