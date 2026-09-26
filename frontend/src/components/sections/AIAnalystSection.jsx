import Container from '../ui/Container.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import Button from '../ui/Button.jsx'
import AIChat from '../ai/AIChat.jsx'
import RevealOnScroll from '../ui/RevealOnScroll.jsx'

export default function AIAnalystSection() {
  return (
    <section id="ai-analyst" className="py-24 sm:py-32">
      <Container className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <SectionHeader
            align="left"
            eyebrow="AI Analyst"
            title="Ask your business anything."
            description="No more digging through spreadsheets and dashboards. Ask questions in natural language and get clear, data-backed answers."
          />
          <RevealOnScroll delay={0.1} className="mt-8">
            <Button to="/analyst" variant="primary" size="lg">
              Open full AI Analyst
            </Button>
          </RevealOnScroll>
        </div>

        <RevealOnScroll delay={0.15} className="rounded-[28px] border border-border bg-white p-5 shadow-card-lg sm:p-7">
          <AIChat />
        </RevealOnScroll>
      </Container>
    </section>
  )
}
