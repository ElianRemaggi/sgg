export default function Loading() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Plantillas de Rutina</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}
