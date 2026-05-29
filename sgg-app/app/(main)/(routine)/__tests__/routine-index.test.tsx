import React from 'react'
import { renderWithProviders } from '@/tests/utils/render'
import RoutineScreen from '@/app/(main)/(routine)/index'
import { apiClient, ApiError } from '@/lib/api'

jest.mock('@/store/gymStore', () => ({
  useGymStore: () => ({ selectedGymId: '1' }),
}))

jest.mock('@/components/routine/RoutineProgressBar', () => ({
  RoutineProgressBar: () => null,
}))

jest.mock('@/components/routine/BlockSection', () => ({
  BlockSection: () => null,
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

const ROUTINE_RESPONSE = {
  success: true,
  data: {
    assignmentId: 10,
    templateName: 'Rutina A',
    startsAt: '2024-01-01',
    endsAt: null,
    blocks: [
      {
        id: 1,
        name: 'Push',
        dayNumber: 1,
        sortOrder: 1,
        exercises: [
          { id: 1, name: 'Press banca', sets: 3, reps: '8-10', restSeconds: 90, notes: null, sortOrder: 1 },
        ],
      },
    ],
  },
}

const PROGRESS_RESPONSE = {
  success: true,
  data: {
    assignmentId: 10,
    totalExercises: 5,
    completedToday: 0,
    completedTotal: 0,
    progressPercent: 0,
    lastActivityAt: null,
    completions: [],
    previousNotesByExerciseId: {},
    currentDayNumber: 1,
  },
}

beforeEach(() => {
  mockApiClient.mockReset()
})

describe('RoutineScreen', () => {
  it('shows routine name after loading', async () => {
    mockApiClient
      .mockResolvedValueOnce(ROUTINE_RESPONSE)
      .mockResolvedValueOnce(PROGRESS_RESPONSE)

    const { findByText } = renderWithProviders(<RoutineScreen />)
    await findByText('Rutina A')
  })

  it('shows start date of assignment', async () => {
    mockApiClient
      .mockResolvedValueOnce(ROUTINE_RESPONSE)
      .mockResolvedValueOnce(PROGRESS_RESPONSE)

    const { findByText } = renderWithProviders(<RoutineScreen />)
    await findByText(/Desde/)
  })

  it('shows empty state when no routine assigned (404)', async () => {
    mockApiClient
      .mockRejectedValueOnce(new ApiError(404, {}))
      .mockResolvedValue(PROGRESS_RESPONSE)

    const { findByText } = renderWithProviders(<RoutineScreen />)
    await findByText('Sin rutina asignada')
  })

  it('shows error screen on server error', async () => {
    mockApiClient
      .mockRejectedValueOnce(new ApiError(500, { message: 'Server error' }))
      .mockResolvedValue(PROGRESS_RESPONSE)

    const { findByText } = renderWithProviders(<RoutineScreen />)
    await findByText('Reintentar')
  })
})
