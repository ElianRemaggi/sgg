import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { router } from 'expo-router'
import { renderWithProviders } from '@/tests/utils/render'
import RoutineHistoryScreen from '@/app/(main)/(routine)/history'
import { apiClient, ApiError } from '@/lib/api'

jest.mock('@/store/gymStore', () => ({
  useGymStore: () => ({ selectedGymId: '1' }),
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

const HISTORY_RESPONSE = {
  success: true,
  data: [
    {
      id: 10,
      templateName: 'Rutina A',
      startsAt: '2024-01-01',
      endsAt: '2024-06-01',
      isActive: false,
      totalSessionDays: 15,
      totalCompletions: 45,
      lastActivityAt: '2024-05-30T10:00:00',
    },
    {
      id: 11,
      templateName: 'Rutina B',
      startsAt: '2024-06-15',
      endsAt: null,
      isActive: true,
      totalSessionDays: 5,
      totalCompletions: 15,
      lastActivityAt: '2024-07-01T10:00:00',
    },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
  mockApiClient.mockReset()
})

describe('RoutineHistoryScreen', () => {
  it('renders both history items after loading', async () => {
    mockApiClient.mockResolvedValueOnce(HISTORY_RESPONSE)

    const { findByText } = renderWithProviders(<RoutineHistoryScreen />)
    await findByText('Rutina A')
    await findByText('Rutina B')
  })

  it('shows active badge for the active assignment', async () => {
    mockApiClient.mockResolvedValueOnce(HISTORY_RESPONSE)

    const { findByText } = renderWithProviders(<RoutineHistoryScreen />)
    await findByText('activa')
  })

  it('shows header title', async () => {
    mockApiClient.mockResolvedValueOnce(HISTORY_RESPONSE)

    const { findByText } = renderWithProviders(<RoutineHistoryScreen />)
    await findByText('Historial de rutinas')
  })

  it('navigates to assignment detail on card press', async () => {
    mockApiClient.mockResolvedValueOnce(HISTORY_RESPONSE)

    const { findByText } = renderWithProviders(<RoutineHistoryScreen />)
    const routinaA = await findByText('Rutina A')
    fireEvent.press(routinaA)

    expect(router.push).toHaveBeenCalledWith('/(main)/(routine)/history/10')
  })

  it('shows empty state when history is empty', async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: [] })

    const { findByText } = renderWithProviders(<RoutineHistoryScreen />)
    await findByText('Sin historial')
  })
})
