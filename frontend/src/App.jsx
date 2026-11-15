import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Footer from './components/layout/Footer.jsx'
import Navbar from './components/layout/Navbar.jsx'
import ScrollToHash from './components/layout/ScrollToHash.jsx'
import PageLoader from './components/ui/PageLoader.jsx'
import { DatasetProvider } from './state/DatasetContext.jsx'
import { ThemeProvider } from './theme/ThemeProvider.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Workspace = lazy(() => import('./pages/Workspace.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

// The dashboard workspace brings its own top bar and has no marketing footer.
function Chrome({ children }) {
  const { pathname } = useLocation()
  const app = pathname.startsWith('/dashboard')
  return (
    <div className="flex min-h-screen flex-col">
      {!app && <Navbar />}
      <main className="flex-1">{children}</main>
      {!app && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <DatasetProvider>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <ScrollToHash />
            <Chrome>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/dashboard" element={<Workspace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Chrome>
          </BrowserRouter>
        </MotionConfig>
      </DatasetProvider>
    </ThemeProvider>
  )
}
