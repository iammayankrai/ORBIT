import Hero from '../components/hero/Hero.jsx'
import TrustStrip from '../components/sections/TrustStrip.jsx'
import ProductShowcase from '../components/sections/ProductShowcase.jsx'
import AIAnalystSection from '../components/sections/AIAnalystSection.jsx'
import DataDetectiveTeaser from '../components/sections/DataDetectiveTeaser.jsx'
import InventoryIntelligence from '../components/sections/InventoryIntelligence.jsx'
import AutomatedInsights from '../components/sections/AutomatedInsights.jsx'
import TechnologySection from '../components/sections/TechnologySection.jsx'
import UseCases from '../components/sections/UseCases.jsx'
import About from '../components/sections/About.jsx'
import Pricing from '../components/sections/Pricing.jsx'

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <ProductShowcase />
      <AIAnalystSection />
      <DataDetectiveTeaser />
      <InventoryIntelligence />
      <AutomatedInsights />
      <TechnologySection />
      <UseCases />
      <About />
      <Pricing />
    </>
  )
}
