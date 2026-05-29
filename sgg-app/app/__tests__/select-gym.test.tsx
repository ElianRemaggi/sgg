import React from 'react'
import { fireEvent, waitFor } from '@testing-library/react-native'
import { router } from 'expo-router'
import { renderWithProviders } from '@/tests/utils/render'
import SelectGymScreen from '@/app/select-gym'
import { apiClient } from '@/lib/api'

const mockSetGym = jest.fn()

jest.mock('@/store/gymStore', () => ({
  useGymStore: jest.fn(() => ({
    selectedGymId: null,
    setGym: mockSetGym,
    clearGym: jest.fn(),
  })),
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

const mockApiClient = apiClient as jest.Mock

const MEMBERSHIPS_RESPONSE = {
  success: true,
  data: [
    {
      membershipId: 1,
      gymId: 1,
      gymName: 'CrossFit Palermo',
      gymSlug: 'crossfit-palermo',
      gymLogoUrl: null,
      role: 'MEMBER',
      status: 'ACTIVE',
      membershipExpiresAt: null,
    },
  ],
}

describe('SelectGymScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiClient.mockResolvedValue(MEMBERSHIPS_RESPONSE)
  })

  it('renders gym name after memberships load', async () => {
    const { findByText } = renderWithProviders(<SelectGymScreen />)
    await findByText('CrossFit Palermo')
  })

  it('shows membership role and slug', async () => {
    const { findByText } = renderWithProviders(<SelectGymScreen />)
    await findByText('MEMBER · crossfit-palermo')
  })

  it('calls setGym and navigates when gym is selected', async () => {
    const { findByText } = renderWithProviders(<SelectGymScreen />)
    const gymCard = await findByText('CrossFit Palermo')
    fireEvent.press(gymCard)

    expect(mockSetGym).toHaveBeenCalledWith('1')
    expect(router.replace).toHaveBeenCalledWith('/(main)/(routine)')
  })

  it('shows search form when there are no active memberships', async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: [] })

    const { findByText, findByPlaceholderText } = renderWithProviders(<SelectGymScreen />)
    await findByText('No tenés membresías activas. Buscá un gym por su slug.')
    await findByPlaceholderText('ej: crossfit-palermo')
  })

  it('shows gym search result after search', async () => {
    mockApiClient
      .mockResolvedValueOnce({ success: true, data: [] }) // memberships (empty)
      .mockResolvedValueOnce({
        success: true,
        data: { id: 2, name: 'Iron Gym', slug: 'iron-gym', description: null, logoUrl: null },
      }) // gym search

    const { findByText, findByPlaceholderText, getByText } = renderWithProviders(<SelectGymScreen />)
    const input = await findByPlaceholderText('ej: crossfit-palermo')
    fireEvent.changeText(input, 'iron-gym')
    fireEvent.press(getByText('Buscar'))

    await findByText('Iron Gym')
    await findByText('Solicitar acceso')
  })
})
