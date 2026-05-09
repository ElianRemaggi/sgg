// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetSession = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}))

const { middleware } = await import('./middleware')

function makeRequest(path: string, cookies: Record<string, string> = {}) {
  const url = `http://localhost${path}`
  const headers = new Headers()
  if (Object.keys(cookies).length > 0) {
    headers.set('cookie', Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '))
  }
  return new NextRequest(url, { headers })
}

describe('middleware', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
  })

  describe('public routes', () => {
    it('redirects / to /landing', async () => {
      const res = await middleware(makeRequest('/'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/landing')
    })

    it('passes /landing without auth', async () => {
      const res = await middleware(makeRequest('/landing'))
      expect(res.status).toBe(200)
    })
  })

  describe('protected routes — unauthenticated', () => {
    it('redirects to /login when accessing protected route without token', async () => {
      const res = await middleware(makeRequest('/select-gym'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/login')
    })

    it('redirects to /login when accessing gym route without token', async () => {
      const res = await middleware(makeRequest('/gym/1/member/routine'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/login')
    })
  })

  describe('protected routes — native token', () => {
    it('allows request with sgg-token cookie', async () => {
      const res = await middleware(makeRequest('/select-gym', { 'sgg-token': 'valid-token' }))
      expect(res.status).toBe(200)
    })
  })

  describe('protected routes — Supabase session', () => {
    it('allows request with valid Supabase session', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'supabase-token' } },
      })
      const res = await middleware(makeRequest('/select-gym'))
      expect(res.status).toBe(200)
    })
  })

  describe('auth pages — already authenticated', () => {
    it('redirects /login to /select-gym with native token', async () => {
      const res = await middleware(makeRequest('/login', { 'sgg-token': 'valid-token' }))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/select-gym')
    })

    it('redirects /login to /select-gym with Supabase session', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'supabase-token' } },
      })
      const res = await middleware(makeRequest('/login'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/select-gym')
    })

    it('allows /login when not authenticated', async () => {
      const res = await middleware(makeRequest('/login'))
      expect(res.status).toBe(200)
    })

    it('redirects /register to /select-gym when authenticated', async () => {
      const res = await middleware(makeRequest('/register', { 'sgg-token': 'valid-token' }))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/select-gym')
    })
  })
})
