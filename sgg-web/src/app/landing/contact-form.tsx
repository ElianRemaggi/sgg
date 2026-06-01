'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

export function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      gymName:     (form.elements.namedItem('gymName') as HTMLInputElement).value.trim(),
      contactName: (form.elements.namedItem('contactName') as HTMLInputElement).value.trim(),
      email:       (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      phone:       (form.elements.namedItem('phone') as HTMLInputElement).value.trim(),
      message:     (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim() || undefined,
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/public/gym-requests`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.message || 'Ocurrió un error. Intentá de nuevo.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Error de conexión. Revisá tu internet e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle size={48} style={{ color: 'hsl(142 76% 55%)' }} />
        <h3 className="text-xl font-semibold text-white">¡Solicitud enviada!</h3>
        <p style={{ color: 'hsl(247 10% 50%)' }}>
          Recibimos tus datos. Te vamos a contactar en las próximas 48 horas.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'hsl(247 10% 60%)' }}>
            Nombre del gimnasio *
          </label>
          <input
            name="gymName"
            required
            placeholder="CrossFit Norte"
            className="rounded-lg border px-4 py-3 text-sm bg-transparent text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: 'rgba(184,180,255,0.15)' }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'hsl(247 10% 60%)' }}>
            Tu nombre *
          </label>
          <input
            name="contactName"
            required
            placeholder="Juan Pérez"
            className="rounded-lg border px-4 py-3 text-sm bg-transparent text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: 'rgba(184,180,255,0.15)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'hsl(247 10% 60%)' }}>
            Email *
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="juan@crossfit.com"
            className="rounded-lg border px-4 py-3 text-sm bg-transparent text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: 'rgba(184,180,255,0.15)' }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'hsl(247 10% 60%)' }}>
            WhatsApp / Teléfono *
          </label>
          <input
            name="phone"
            required
            placeholder="+54 9 11 5555-0000"
            className="rounded-lg border px-4 py-3 text-sm bg-transparent text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: 'rgba(184,180,255,0.15)' }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'hsl(247 10% 60%)' }}>
          Mensaje (opcional)
        </label>
        <textarea
          name="message"
          rows={3}
          placeholder="Contanos un poco sobre tu gimnasio: cuántos socios tenés, qué tipo de entrenamiento ofrecés, etc."
          className="rounded-lg border px-4 py-3 text-sm bg-transparent text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-all resize-none"
          style={{ borderColor: 'rgba(184,180,255,0.15)' }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary px-8 py-4 rounded-xl font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </form>
  )
}
