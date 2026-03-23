'use client'

import { Button } from '@/components/ui/button'

export default function MembersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="mb-4 text-muted-foreground">Error al cargar los miembros: {error.message}</p>
      <Button onClick={reset} variant="outline">Reintentar</Button>
    </div>
  )
}
