import { useCallback, useState } from 'react'
import Hero from '../components/hero/Hero.jsx'
import HowItWorks from '../components/sections/HowItWorks.jsx'
import ResultsSection from '../components/results/ResultsSection.jsx'
import TechStack from '../components/sections/TechStack.jsx'
import ClosingCTA from '../components/sections/ClosingCTA.jsx'

export default function Home() {
  const [analysis, setAnalysis] = useState(null)
  const [datasetSource, setDatasetSource] = useState(null)
  const [uploadKey, setUploadKey] = useState(0)

  const handleAnalyzed = useCallback((source, result) => {
    setDatasetSource(source)
    setAnalysis(result)
    requestAnimationFrame(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const handleReset = useCallback(() => {
    setAnalysis(null)
    setDatasetSource(null)
    // Remounts Hero (and the UploadPanel inside it) so its internal
    // processing/error state is wiped, not left stuck on the last run.
    setUploadKey((k) => k + 1)
    requestAnimationFrame(() => {
      document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  return (
    <>
      <Hero key={uploadKey} onAnalyzed={handleAnalyzed} />
      {analysis ? (
        <ResultsSection analysis={analysis} datasetSource={datasetSource} onReset={handleReset} />
      ) : (
        <HowItWorks />
      )}
      <TechStack />
      <ClosingCTA />
    </>
  )
}
