import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../../tests/utils/render'
import { HistoryListView } from '../history-list-view'
import { aAssignmentSummary } from '../../../../tests/utils/factories'

const BASE = '/gym/1/member/history'

describe('HistoryListView', () => {
  it('shows active tab by default with active assignment', () => {
    render(
      <HistoryListView
        assignments={[aAssignmentSummary({ isActive: true, templateName: 'Hipertrofia' })]}
        basePath={BASE}
      />
    )
    expect(screen.getByText('Hipertrofia')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /activa/i })).toBeInTheDocument()
  })

  it('shows Activa badge next to active assignment', () => {
    render(
      <HistoryListView
        assignments={[aAssignmentSummary({ isActive: true })]}
        basePath={BASE}
      />
    )
    // Badge inside card
    const badges = screen.getAllByText('Activa')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('switches to past tab and shows past assignments', async () => {
    const user = userEvent.setup()
    render(
      <HistoryListView
        assignments={[
          aAssignmentSummary({ id: 1, isActive: true, templateName: 'Rutina Activa' }),
          aAssignmentSummary({ id: 2, isActive: false, templateName: 'Rutina Pasada', endsAt: '2025-12-01T00:00:00Z' }),
        ]}
        basePath={BASE}
      />
    )

    await user.click(screen.getByRole('button', { name: /pasadas/i }))

    expect(screen.getByText('Rutina Pasada')).toBeInTheDocument()
    expect(screen.queryByText('Rutina Activa')).not.toBeInTheDocument()
  })

  it('shows empty state message in active tab when no active assignments', () => {
    render(
      <HistoryListView
        assignments={[aAssignmentSummary({ isActive: false })]}
        basePath={BASE}
      />
    )
    expect(screen.getByText(/no tenés rutina activa/i)).toBeInTheDocument()
  })

  it('shows empty state message in past tab when no past assignments', async () => {
    const user = userEvent.setup()
    render(
      <HistoryListView
        assignments={[aAssignmentSummary({ isActive: true })]}
        basePath={BASE}
      />
    )
    await user.click(screen.getByRole('button', { name: /pasadas/i }))
    expect(screen.getByText(/no hay rutinas pasadas/i)).toBeInTheDocument()
  })

  it('renders link to assignment detail with correct href', () => {
    render(
      <HistoryListView
        assignments={[aAssignmentSummary({ id: 42, isActive: true })]}
        basePath={BASE}
      />
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `${BASE}/42`)
  })

  it('displays completions and session days counts', () => {
    render(
      <HistoryListView
        assignments={[aAssignmentSummary({ totalCompletions: 48, totalSessionDays: 12 })]}
        basePath={BASE}
      />
    )
    expect(screen.getByText(/48 completions/i)).toBeInTheDocument()
    expect(screen.getByText(/12 días entrenados/i)).toBeInTheDocument()
  })

  it('shows correct past count in tab label', () => {
    render(
      <HistoryListView
        assignments={[
          aAssignmentSummary({ id: 1, isActive: true }),
          aAssignmentSummary({ id: 2, isActive: false }),
          aAssignmentSummary({ id: 3, isActive: false }),
        ]}
        basePath={BASE}
      />
    )
    expect(screen.getByRole('button', { name: /pasadas \(2\)/i })).toBeInTheDocument()
  })
})
