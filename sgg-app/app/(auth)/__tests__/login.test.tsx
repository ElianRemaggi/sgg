import React from 'react'
import { fireEvent, waitFor } from '@testing-library/react-native'
import { router } from 'expo-router'
import { renderWithProviders } from '@/tests/utils/render'
import LoginScreen from '@/app/(auth)/login'
import { nativeLogin } from '@/lib/auth'
import { ApiError } from '@/lib/api'

jest.mock('@/lib/auth', () => ({
  nativeLogin: jest.fn(),
  navigateAfterAuth: jest.fn().mockImplementation(() => {
    require('expo-router').router.replace('/')
  }),
  syncSupabaseUser: jest.fn(),
  logout: jest.fn(),
  isUnauthorized: jest.fn(),
}))

jest.mock('@/lib/api', () => ({
  apiClient: jest.fn(),
  ApiError: class ApiError extends Error {
    status: number
    body: any
    constructor(status: number, body: any) {
      super(body?.message ?? `HTTP ${status}`)
      this.status = status
      this.body = body
    }
  },
}))

const mockNativeLogin = nativeLogin as jest.MockedFunction<typeof nativeLogin>

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders email, password fields and submit button', () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />)
    expect(getByPlaceholderText('usuario@ejemplo.com')).toBeTruthy()
    expect(getByPlaceholderText('••••••••')).toBeTruthy()
    expect(getByText('Iniciar sesión')).toBeTruthy()
  })

  it('does not call nativeLogin when submitting empty form', async () => {
    const { getByText } = renderWithProviders(<LoginScreen />)
    fireEvent.press(getByText('Iniciar sesión'))
    await waitFor(() => {
      expect(mockNativeLogin).not.toHaveBeenCalled()
    })
  })

  it('calls nativeLogin with credentials and navigates on success', async () => {
    mockNativeLogin.mockResolvedValueOnce({
      token: 'jwt',
      user: { id: 1, fullName: 'Test User', email: 'test@test.com' },
    })

    const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText('usuario@ejemplo.com'), 'testuser')
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123')
    fireEvent.press(getByText('Iniciar sesión'))

    await waitFor(() => {
      expect(mockNativeLogin).toHaveBeenCalledWith('testuser', 'password123')
      expect(router.replace).toHaveBeenCalledWith('/')
    })
  })

  it('shows API error message in toast', async () => {
    mockNativeLogin.mockRejectedValueOnce(new ApiError(401, { message: 'Credenciales inválidas' }))

    const { getByPlaceholderText, getByText, findByText } = renderWithProviders(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText('usuario@ejemplo.com'), 'bad@user.com')
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpass')
    fireEvent.press(getByText('Iniciar sesión'))

    await findByText('Credenciales inválidas')
  })

  it('shows generic error message on unexpected failure', async () => {
    mockNativeLogin.mockRejectedValueOnce(new Error('Network error'))

    const { getByPlaceholderText, getByText, findByText } = renderWithProviders(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText('usuario@ejemplo.com'), 'user')
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'pass')
    fireEvent.press(getByText('Iniciar sesión'))

    await findByText('Error al iniciar sesión')
  })
})
