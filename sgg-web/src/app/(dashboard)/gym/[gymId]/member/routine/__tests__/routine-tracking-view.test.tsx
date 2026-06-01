import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../../../../../../tests/utils/render'
import { aRoutine, aTracking, aExercise, aCompletion } from '../../../../../../../../tests/utils/factories'
import { RoutineTrackingView } from '../routine-tracking-view'

// Mock server actions (they call apiClient which is server-only)
vi.mock('../actions', () => ({
  completeExercise: vi.fn(),
  undoExercise: vi.fn(),
}))

import * as actionsModule from '../actions'
const completeExercise = vi.mocked(actionsModule.completeExercise)
const undoExercise = vi.mocked(actionsModule.undoExercise)

describe('RoutineTrackingView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    completeExercise.mockResolvedValue({ success: true })
    undoExercise.mockResolvedValue({ success: true })
  })

  it('renders routine template name', () => {
    render(<RoutineTrackingView gymId="1" routine={aRoutine()} progress={null} />)
    expect(screen.getByText('Hipertrofia Vol. A')).toBeInTheDocument()
  })

  it('renders day tabs for each block', () => {
    const routine = aRoutine({
      blocks: [
        { id: 1, name: 'Push', dayNumber: 1, sortOrder: 1, exercises: [] },
        { id: 2, name: 'Pull', dayNumber: 2, sortOrder: 2, exercises: [] },
      ],
    })
    render(<RoutineTrackingView gymId="1" routine={routine} progress={null} />)
    expect(screen.getByRole('button', { name: /día 1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /día 2/i })).toBeInTheDocument()
  })

  it('shows progress bar when progress data is provided', () => {
    render(
      <RoutineTrackingView gymId="1" routine={aRoutine()} progress={aTracking()} />
    )
    // Progress section shows completed/total
    expect(screen.getByText(/0 \/ 3 ejercicios/i)).toBeInTheDocument()
  })

  it('marks exercise as "hoy" when currentDayNumber matches', () => {
    const routine = aRoutine({
      blocks: [{ id: 1, name: 'Push', dayNumber: 1, sortOrder: 1, exercises: [aExercise()] }],
    })
    render(
      <RoutineTrackingView gymId="1" routine={routine} progress={aTracking({ currentDayNumber: 1 })} />
    )
    expect(screen.getAllByText(/hoy/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows exercise name and expand button when not completed', () => {
    render(
      <RoutineTrackingView
        gymId="1"
        routine={aRoutine({ blocks: [{ id: 1, name: 'Push', dayNumber: 1, sortOrder: 1, exercises: [aExercise({ name: 'Press Banca' })] }] })}
        progress={null}
      />
    )
    expect(screen.getByText('Press Banca')).toBeInTheDocument()
  })

  it('expands exercise form on chevron click and allows completion', async () => {
    const user = userEvent.setup()
    render(
      <RoutineTrackingView
        gymId="1"
        routine={aRoutine({ blocks: [{ id: 1, name: 'Push', dayNumber: 1, sortOrder: 1, exercises: [aExercise({ id: 1 })] }] })}
        progress={aTracking({ completions: [] })}
      />
    )

    // The expand button has no text (just an SVG icon) — find by absence of text content
    const allButtons = screen.getAllByRole('button')
    const expandBtn = allButtons.find(b => !b.textContent?.trim())!
    await user.click(expandBtn)

    // Form appears
    expect(screen.getByPlaceholderText(/ej: 60/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/ej: 10/i)).toBeInTheDocument()

    // Fill in and submit
    await user.type(screen.getByPlaceholderText(/ej: 60/i), '80')
    await user.type(screen.getByPlaceholderText(/ej: 10/i), '8')
    await user.click(screen.getByRole('button', { name: /completar/i }))

    await waitFor(() =>
      expect(completeExercise).toHaveBeenCalledWith('1', 1, 1, 80, 8, null)
    )
  })

  it('shows completed state with check icon and weight badge', () => {
    const completion = aCompletion({ exerciseId: 1, isCompleted: true, weightKg: 80, actualReps: 8 })
    render(
      <RoutineTrackingView
        gymId="1"
        routine={aRoutine({ blocks: [{ id: 1, name: 'Push', dayNumber: 1, sortOrder: 1, exercises: [aExercise({ id: 1 })] }] })}
        progress={aTracking({ completions: [completion] })}
      />
    )
    expect(screen.getByText(/80 kg/i)).toBeInTheDocument()
    expect(screen.getByText(/8 reps/i)).toBeInTheDocument()
  })

  it('requests confirmation before undo, then calls undoExercise', async () => {
    const user = userEvent.setup()
    const completion = aCompletion({ exerciseId: 1, isCompleted: true })
    render(
      <RoutineTrackingView
        gymId="1"
        routine={aRoutine({ blocks: [{ id: 1, name: 'Push', dayNumber: 1, sortOrder: 1, exercises: [aExercise({ id: 1 })] }] })}
        progress={aTracking({ completions: [completion] })}
      />
    )

    // First click: shows confirmation text
    // The undo button is the only button visible when exercise is completed
    const undoBtns = screen.getAllByRole('button')
    const undoBtn = undoBtns.find(b => b.querySelector('svg'))!
    await user.click(undoBtn)
    expect(screen.getByText(/confirmar/i)).toBeInTheDocument()
    expect(undoExercise).not.toHaveBeenCalled()

    // Second click confirms
    await user.click(undoBtn)
    await waitFor(() => expect(undoExercise).toHaveBeenCalledWith('1', 1, 1))
  })

  it('shows "Observación" from previous session when form is expanded', async () => {
    const user = userEvent.setup()
    render(
      <RoutineTrackingView
        gymId="1"
        routine={aRoutine({ blocks: [{ id: 1, name: 'Push', dayNumber: 1, sortOrder: 1, exercises: [aExercise({ id: 1 })] }] })}
        progress={aTracking({ completions: [], previousNotesByExerciseId: { 1: 'Subir 2.5 kg la próxima' } })}
      />
    )

    const expandBtn = screen.getByRole('button', { name: '' })
    await user.click(expandBtn)

    expect(screen.getByText(/Observación:/i)).toBeInTheDocument()
    expect(screen.getByText(/Subir 2\.5 kg la próxima/i)).toBeInTheDocument()
  })

  it('does not show "Observación" when there are no previous notes', async () => {
    const user = userEvent.setup()
    render(
      <RoutineTrackingView
        gymId="1"
        routine={aRoutine({ blocks: [{ id: 1, name: 'Push', dayNumber: 1, sortOrder: 1, exercises: [aExercise({ id: 1 })] }] })}
        progress={aTracking({ completions: [], previousNotesByExerciseId: {} })}
      />
    )

    const expandBtn = screen.getByRole('button', { name: '' })
    await user.click(expandBtn)

    expect(screen.queryByText(/Observación:/i)).not.toBeInTheDocument()
  })

  it('shows toast error when completeExercise fails', async () => {
    completeExercise.mockResolvedValue({ success: false, error: 'Error al completar' })
    const user = userEvent.setup()
    render(
      <RoutineTrackingView
        gymId="1"
        routine={aRoutine({ blocks: [{ id: 1, name: 'Push', dayNumber: 1, sortOrder: 1, exercises: [aExercise({ id: 1 })] }] })}
        progress={aTracking({ completions: [] })}
      />
    )

    const expandBtn = screen.getByRole('button', { name: '' })
    await user.click(expandBtn)
    await user.click(screen.getByRole('button', { name: /completar/i }))

    await waitFor(() =>
      expect(screen.getByText('Error al completar')).toBeInTheDocument()
    )
  })
})
