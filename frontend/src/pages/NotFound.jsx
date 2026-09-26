import Button from '../components/ui/Button.jsx'
import Container from '../components/ui/Container.jsx'

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">This page doesn't exist.</h1>
      <p className="max-w-md text-ink-soft">The page you're looking for may have moved. Head back home or jump into the demo.</p>
      <div className="mt-2 flex gap-3">
        <Button to="/" variant="primary">
          Back to home
        </Button>
        <Button to="/analyst" variant="secondary">
          Try AI Analyst
        </Button>
      </div>
    </Container>
  )
}
