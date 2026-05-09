import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../../tests/msw/server'

// Mock next/headers before importing apiClient
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { cookies } = await import('next/headers') as { cookies: ReturnType<typeof vi.fn> }
const { createClient } = await import('@/lib/supabase/server') as { createClient: ReturnType<typeof vi.fn> }
const { apiClient, ApiError, getErrorMessage } = await import('@/lib/api/client')

const BASE = 'http://localhost:8080'

function makeCookieStore(token?: string) {
  return { get: (name: string) => (name === 'sgg-token' && token ? { value: token } : undefined) }
}

function makeSupabaseClient(token?: string) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: token ? { access_token: token } : null },
      }),
    },
  }
}

describe('apiClient — auth token resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses Supabase access_token when session exists', async () => {
    createClient.mockReturnValue(makeSupabaseClient('supabase-token'))
    cookies.mockReturnValue(makeCookieStore())

    let capturedAuth: string | null = null
    server.use(
      http.get(`${BASE}/api/test`, ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await apiClient('/api/test')
    expect(capturedAuth).toBe('Bearer supabase-token')
  })

  it('falls back to native sgg-token cookie when no Supabase session', async () => {
    createClient.mockReturnValue(makeSupabaseClient())
    cookies.mockReturnValue(makeCookieStore('native-token'))

    let capturedAuth: string | null = null
    server.use(
      http.get(`${BASE}/api/test`, ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await apiClient('/api/test')
    expect(capturedAuth).toBe('Bearer native-token')
  })

  it('sends no Authorization header when no token available', async () => {
    createClient.mockReturnValue(makeSupabaseClient())
    cookies.mockReturnValue(makeCookieStore())

    let capturedAuth: string | null = 'present'
    server.use(
      http.get(`${BASE}/api/test`, ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await apiClient('/api/test')
    expect(capturedAuth).toBeNull()
  })

  it('falls back to cookie when Supabase throws', async () => {
    createClient.mockReturnValue({
      auth: { getSession: vi.fn().mockRejectedValue(new Error('Supabase error')) },
    })
    cookies.mockReturnValue(makeCookieStore('fallback-token'))

    let capturedAuth: string | null = null
    server.use(
      http.get(`${BASE}/api/test`, ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await apiClient('/api/test')
    expect(capturedAuth).toBe('Bearer fallback-token')
  })
})

describe('apiClient — response handling', () => {
  beforeEach(() => {
    createClient.mockReturnValue(makeSupabaseClient())
    cookies.mockReturnValue(makeCookieStore())
  })

  it('returns parsed JSON on 200', async () => {
    server.use(
      http.get(`${BASE}/api/data`, () => HttpResponse.json({ success: true, data: { value: 42 } }))
    )
    const result = await apiClient<{ success: boolean; data: { value: number } }>('/api/data')
    expect(result.data.value).toBe(42)
  })

  it('throws ApiError on 4xx with JSON body', async () => {
    server.use(
      http.get(`${BASE}/api/forbidden`, () =>
        HttpResponse.json({ message: 'Acceso denegado', errors: [] }, { status: 403 })
      )
    )
    await expect(apiClient('/api/forbidden')).rejects.toThrow(ApiError)
    await expect(apiClient('/api/forbidden')).rejects.toMatchObject({ status: 403 })
  })

  it('throws ApiError on 4xx without JSON body', async () => {
    server.use(
      http.get(`${BASE}/api/bad`, () => new HttpResponse('Not JSON', { status: 500 }))
    )
    await expect(apiClient('/api/bad')).rejects.toThrow(ApiError)
    await expect(apiClient('/api/bad')).rejects.toMatchObject({ status: 500 })
  })
})

describe('getErrorMessage', () => {
  it('returns permission message for 403', () => {
    const err = new ApiError(403, {})
    expect(getErrorMessage(err)).toBe('No tenés permiso para realizar esta acción')
  })

  it('returns not-found message for 404', () => {
    const err = new ApiError(404, {})
    expect(getErrorMessage(err)).toBe('El recurso no existe o fue eliminado')
  })

  it('returns body.message for 409', () => {
    const err = new ApiError(409, { message: 'Ya existe ese recurso' })
    expect(getErrorMessage(err)).toBe('Ya existe ese recurso')
  })

  it('returns default conflict message for 409 without message', () => {
    const err = new ApiError(409, {})
    expect(getErrorMessage(err)).toBe('Conflicto al procesar la solicitud')
  })

  it('returns body.message for generic ApiError', () => {
    const err = new ApiError(500, { message: 'Error interno' })
    expect(getErrorMessage(err)).toBe('Error interno')
  })

  it('returns fallback for ApiError without message', () => {
    const err = new ApiError(500, {})
    expect(getErrorMessage(err)).toBe('Error al procesar la solicitud')
  })

  it('returns connection error for non-ApiError', () => {
    expect(getErrorMessage(new Error('network'))).toBe('Error de conexión')
    expect(getErrorMessage('string error')).toBe('Error de conexión')
    expect(getErrorMessage(null)).toBe('Error de conexión')
  })
})
