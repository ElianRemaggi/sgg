import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, DELETE } from './route'

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/native', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/native', () => {
  it('sets sgg-token httpOnly cookie and returns success', async () => {
    const req = makePostRequest({ token: 'my-jwt-token' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ success: true })

    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('sgg-token=my-jwt-token')
    expect(setCookie.toLowerCase()).toContain('httponly')
    expect(setCookie.toLowerCase()).toContain('samesite=lax')
    expect(setCookie).toContain('Path=/')
  })

  it('does NOT set secure flag in non-production env', async () => {
    const req = makePostRequest({ token: 'tok' })
    const res = await POST(req)
    const setCookie = res.headers.get('set-cookie') ?? ''
    // NODE_ENV is 'test', not 'production'
    expect(setCookie.toLowerCase()).not.toContain('secure')
  })

  it('returns 400 when token is missing', async () => {
    const req = makePostRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })
})

describe('DELETE /api/auth/native', () => {
  it('clears sgg-token cookie and returns success', async () => {
    const res = await DELETE()

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ success: true })

    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('sgg-token=')
    expect(setCookie).toContain('Max-Age=0')
  })
})
