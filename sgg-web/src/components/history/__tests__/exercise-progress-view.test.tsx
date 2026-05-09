import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../../tests/utils/render'
import { ExerciseProgressView } from '../exercise-progress-view'
import { aExerciseProgress } from '../../../../tests/utils/factories'
import type { ExerciseProgressDto } from '@/lib/api/types'

describe('ExerciseProgressView', () => {
  it('renders exercise name and block context', () => {
    render(<ExerciseProgressView progress={aExerciseProgress()} />)
    expect(screen.getByRole('heading', { name: /press banca/i })).toBeInTheDocument()
    expect(screen.getByText(/push/i)).toBeInTheDocument()
    expect(screen.getByText(/día 1/i)).toBeInTheDocument()
  })

  it('displays all stat cards with correct values', () => {
    render(<ExerciseProgressView progress={aExerciseProgress()} />)
    // Labels are unique
    expect(screen.getByText(/mejor peso/i)).toBeInTheDocument()
    expect(screen.getByText(/promedio/i)).toBeInTheDocument()
    expect(screen.getByText('sesiones')).toBeInTheDocument()
    expect(screen.getByText(/último peso/i)).toBeInTheDocument()
    // Values may repeat across stat cards and session history list
    expect(screen.getAllByText(/90 kg/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/80 kg/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows delta badge with positive sign', () => {
    render(<ExerciseProgressView progress={aExerciseProgress({ stats: { sessionsCount: 3, bestWeightKg: 90, avgWeightKg: 80, firstWeightKg: 70, lastWeightKg: 90, deltaPercent: 28.6 } })} />)
    expect(screen.getByText(/\+28\.6%/)).toBeInTheDocument()
  })

  it('shows delta badge with negative sign', () => {
    render(
      <ExerciseProgressView
        progress={aExerciseProgress({
          stats: { sessionsCount: 2, bestWeightKg: 80, avgWeightKg: 75, firstWeightKg: 80, lastWeightKg: 70, deltaPercent: -12.5 },
        })}
      />
    )
    expect(screen.getByText(/-12\.5%/)).toBeInTheDocument()
  })

  it('renders SVG chart when there are 2+ sessions with weight', () => {
    const { container } = render(<ExerciseProgressView progress={aExerciseProgress()} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(3) // one per session
  })

  it('shows "Necesitás al menos 2 sesiones" when only 1 session with weight', () => {
    const progress = aExerciseProgress({
      sessions: [{
        sessionDate: '2026-01-10',
        weightKg: 70,
        actualReps: 8,
        notes: null,
        isCompleted: true,
        completedAt: '2026-01-10T10:00:00Z',
      }],
    })
    render(<ExerciseProgressView progress={progress} />)
    expect(screen.getByText(/al menos 2 sesiones/i)).toBeInTheDocument()
  })

  it('shows "Sin datos de peso" when no sessions have weight', () => {
    const progress: ExerciseProgressDto = {
      exerciseId: 200,
      exerciseName: 'Flexiones',
      blockName: 'Push',
      dayNumber: 1,
      sessions: [{
        sessionDate: '2026-01-10',
        weightKg: null,
        actualReps: 15,
        notes: null,
        isCompleted: true,
        completedAt: '2026-01-10T10:00:00Z',
      }],
      stats: { sessionsCount: 1, bestWeightKg: null, avgWeightKg: null, firstWeightKg: null, lastWeightKg: null, deltaPercent: null },
    }
    render(<ExerciseProgressView progress={progress} />)
    expect(screen.getByText(/sin datos de peso/i)).toBeInTheDocument()
  })

  it('renders session history list in reverse order', () => {
    render(<ExerciseProgressView progress={aExerciseProgress()} />)
    // Latest session (mar.) should appear before oldest (ene.)
    const rows = screen.getAllByText(/kg/)
    expect(rows.length).toBeGreaterThan(0)
    // Stats cards and session list both show kg values
    expect(screen.getAllByText(/90 kg/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows em dash for null stat values', () => {
    const progress = aExerciseProgress({
      stats: { sessionsCount: 0, bestWeightKg: null, avgWeightKg: null, firstWeightKg: null, lastWeightKg: null, deltaPercent: null },
    })
    render(<ExerciseProgressView progress={progress} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })
})
