import OrbitMark from '../../motion/OrbitMark.jsx'

export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <OrbitMark size={64} mode="loop" />
    </div>
  )
}
