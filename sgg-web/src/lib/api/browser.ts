'use client'

import { createClient } from '@/lib/supabase/client'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL

export class ApiError extends Error {
  constructor(public status: number, public body: { message?: string; errors?: string[] }) {
    super(body.message ?? `HTTP ${status}`)
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return error.body.message ?? "Conflicto al procesar la solicitud"
    if (error.status === 403) return "No tenés permiso para realizar esta acción"
    if (error.status === 404) return "El recurso no existe o fue eliminado"
    return error.body.message ?? "Error al procesar la solicitud"
  }
  return "Error de conexión"
}

async function getBrowserAuthToken(): Promise<string | null> {
  const match = document.cookie.match(/(?:^|;\s*)sgg-token=([^;]*)/)
  if (match) return decodeURIComponent(match[1])

  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) return session.access_token
  } catch { }

  return null
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getBrowserAuthToken()

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new ApiError(res.status, error)
  }

  return res.json()
}
