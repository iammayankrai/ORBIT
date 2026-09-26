import Container from '../ui/Container.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import Button from '../ui/Button.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'

export default function ClosingCTA() {
  return (
    <section className="py-24 sm:py-32">
      <Container className="flex flex-col items-center">
        <SectionHeader
          eyebrow="Get started"
          title="See what your own data is telling you."
          description="Free to try — no account, no credit card. Upload a file or use the sample dataset."
        />
        <RevealOnScroll delay={0.1} className="mt-9">
          <Button href="#upload" variant="accent" size="lg">
            Upload Your Data
          </Button>
        </RevealOnScroll>
      </Container>
    </section>
  )
}
