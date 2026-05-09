import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../../tests/utils/render'
import { AssignmentDetailView } from '../assignment-detail-view'
import { aAssignmentDetail } from '../../../../tests/utils/factories'

const BASE = '/gym/1/member/history'

describe('AssignmentDetailView', () => {
  it('renders template name', () => {
    render(
      <AssignmentDetailView detail={aAssignmentDetail({ templateName: 'Hipertrofia Vol. A' })} basePath={BASE} />
    )
    expect(screen.getByRole('heading', { name: /hipertrofia vol\. a/i })).toBeInTheDocument()
  })

  it('shows Activa badge when assignment is active', () => {
    render(
      <AssignmentDetailView detail={aAssignmentDetail({ isActive: true })} basePath={BASE} />
    )
    expect(screen.getAllByText('Activa').length).toBeGreaterThanOrEqual(1)
  })

  it('does not show Activa badge when assignment is not active', () => {
    render(
      <AssignmentDetailView
        detail={aAssignmentDetail({ isActive: false })}
        basePath={BASE}
      />
    )
    expect(screen.queryByText('Activa')).not.toBeInTheDocument()
  })

  it('renders stat cards with correct values', () => {
    const detail = aAssignmentDetail({
      stats: { totalDistinctDays: 15, totalCompletions: 60, firstActivityAt: null, lastActivityAt: null },
      blocks: [],
    })
    render(<AssignmentDetailView detail={detail} basePath={BASE} />)

    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText(/días entrenados/i)).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText(/completions/i)).toBeInTheDocument()
  })

  it('renders block name and day number', () => {
    render(
      <AssignmentDetailView detail={aAssignmentDetail()} basePath={BASE} />
    )
    expect(screen.getByText('Push')).toBeInTheDocument()
    expect(screen.getByText(/día 1/i)).toBeInTheDocument()
  })

  it('renders exercise name with sessionsCount and bestWeightKg', () => {
    render(
      <AssignmentDetailView detail={aAssignmentDetail()} basePath={BASE} />
    )
    expect(screen.getByText('Press Banca')).toBeInTheDocument()
    expect(screen.getByText(/8 sesión/i)).toBeInTheDocument()
    expect(screen.getByText(/mejor: 90 kg/i)).toBeInTheDocument()
  })

  it('does not show weight stats for exercises without weight data', () => {
    const detail = aAssignmentDetail({
      blocks: [{
        id: 10,
        name: 'Cardio',
        dayNumber: 1,
        exercises: [{
          exerciseId: 200,
          name: 'Correr',
          sessionsCount: 5,
          bestWeightKg: null,
          avgWeightKg: null,
          lastWeightKg: null,
        }],
      }],
    })
    render(<AssignmentDetailView detail={detail} basePath={BASE} />)
    expect(screen.queryByText(/mejor:/i)).not.toBeInTheDocument()
  })

  it('exercise row links to correct exercise progress URL', () => {
    render(<AssignmentDetailView detail={aAssignmentDetail({ id: 1 })} basePath={BASE} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `${BASE}/1/exercises/100`)
  })

  it('shows "Sin ejercicios registrados" for empty block', () => {
    const detail = aAssignmentDetail({
      blocks: [{ id: 10, name: 'Empty', dayNumber: 1, exercises: [] }],
    })
    render(<AssignmentDetailView detail={detail} basePath={BASE} />)
    expect(screen.getByText(/sin ejercicios registrados/i)).toBeInTheDocument()
  })
})
