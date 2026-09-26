export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-ink" />
    </div>
  )
}
