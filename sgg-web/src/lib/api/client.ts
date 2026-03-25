import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const API_BASE = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL

export class ApiError extends Error {
  constructor(public status: number, public body: { message?: string; errors?: string[] }) {
    super(body.message ?? `HTTP ${status}`)
  }
}

async function getAuthToken(): Promise<string | null> {
  // Try Supabase session first
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      return session.access_token
    }
  } catch {
    // Supabase not available, try native token
  }

  // Fallback to native token cookie
  const cookieStore = cookies()
  const nativeToken = cookieStore.get('sgg-token')?.value
  return nativeToken || null
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new ApiError(res.status, error)
  }

  return res.json()
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
