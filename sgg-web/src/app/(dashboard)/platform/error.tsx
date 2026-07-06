'use client'

import { Button } from '@/components/ui/button'

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="mb-1 font-medium">Algo salió mal</p>
      <p className="mb-4 text-sm text-muted-foreground">{error.message || 'Error inesperado al cargar la página.'}</p>
      <Button onClick={reset} variant="outline">Reintentar</Button>
    </div>
  )
}
