'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { updateAutoAcceptAction } from './actions'

interface AutoAcceptToggleProps {
  gymId: string
  initialValue: boolean
}

export function AutoAcceptToggle({ gymId, initialValue }: AutoAcceptToggleProps) {
  const [enabled, setEnabled] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleToggle() {
    const newValue = !enabled
    setSaving(true)
    setMessage(null)

    const res = await updateAutoAcceptAction(gymId, newValue)

    if (res.success) {
      setEnabled(newValue)
      setMessage({ type: 'success', text: 'Configuración guardada' })
    } else {
      setMessage({ type: 'error', text: res.error ?? 'Error al guardar' })
    }

    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aceptar miembros automáticamente</CardTitle>
        <CardDescription>
          Cuando está activado, los nuevos miembros se unen directamente sin necesidad de aprobación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              enabled ? 'bg-primary' : 'bg-input'
            }`}
          >
            <span
              className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-muted-foreground">
            {enabled ? 'Activado' : 'Desactivado'}
          </span>
        </div>

        {message && (
          <div className={`mt-3 rounded-lg px-4 py-2 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
