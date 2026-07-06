export default function PlatformLoading() {
  return (
    <div className="space-y-3">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  )
}
