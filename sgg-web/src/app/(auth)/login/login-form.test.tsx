import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { render } from '../../../../tests/utils/render'
import { server } from '../../../../tests/msw/server'
import { LoginForm } from './login-form'

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockSignInWithOAuth = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithOAuth: mockSignInWithOAuth },
  }),
}))

const API_URL = 'http://localhost:8080'
const LOGIN_URL = `${API_URL}/api/public/auth/login`
// Relative URL — match by path pattern so it works regardless of jsdom origin resolution
const NATIVE_ROUTE = /\/api\/auth\/native/

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignInWithOAuth.mockResolvedValue({ error: null })
    // Reset to happy-path login
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json({ success: true, data: { token: 'test-token' } })
      ),
      http.post(NATIVE_ROUTE, () => HttpResponse.json({ success: true }))
    )
  })

  it('renders email/password fields and Google button', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email o usuario/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('successful login calls API, sets cookie and redirects to /select-gym', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email o usuario/i), 'user@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/select-gym'))
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('shows error message on invalid credentials', async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json({ message: 'Email o contraseña incorrectos' }, { status: 401 })
      )
    )
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email o usuario/i), 'bad@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() =>
      expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument()
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows Google-specific message when account uses OAuth', async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json({ message: 'Esta cuenta usa Google para ingresar' }, { status: 401 })
      )
    )
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email o usuario/i), 'google@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'anything')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() =>
      expect(screen.getByText(/usá el botón de google/i)).toBeInTheDocument()
    )
  })

  it('shows connection error on network failure', async () => {
    server.use(
      http.post(LOGIN_URL, () => HttpResponse.error())
    )
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email o usuario/i), 'user@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() =>
      expect(screen.getByText(/error de conexión/i)).toBeInTheDocument()
    )
  })

  it('calls supabase signInWithOAuth when clicking Google button', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() =>
      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      )
    )
  })
})
