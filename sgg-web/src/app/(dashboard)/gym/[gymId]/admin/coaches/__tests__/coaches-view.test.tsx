import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../../../../../../tests/utils/render'
import { aCoach, aGymMember } from '../../../../../../../../tests/utils/factories'
import { CoachesView } from '../coaches-view'

vi.mock('../actions', () => ({
  assignCoach: vi.fn(),
  unassignCoach: vi.fn(),
}))

import * as actionsModule from '../actions'
const assignCoach = vi.mocked(actionsModule.assignCoach)

describe('CoachesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assignCoach.mockResolvedValue({ success: true })
  })

  it('renders coach name, email and member count badge', () => {
    render(
      <CoachesView
        coaches={[aCoach({ fullName: 'Carlos Entrenador', email: 'carlos@gym.com', assignedMembersCount: 3 })]}
        unassignedMembers={[aGymMember()]}
        gymId="1"
      />
    )
    expect(screen.getByText('Carlos Entrenador')).toBeInTheDocument()
    expect(screen.getByText('carlos@gym.com')).toBeInTheDocument()
    expect(screen.getByText(/3 alumnos/i)).toBeInTheDocument()
  })

  it('uses singular "alumno" when count is 1', () => {
    render(
      <CoachesView
        coaches={[aCoach({ assignedMembersCount: 1 })]}
        unassignedMembers={[aGymMember()]}
        gymId="1"
      />
    )
    expect(screen.getByText(/1 alumno$/i)).toBeInTheDocument()
  })

  it('shows empty state when there are no coaches', () => {
    render(<CoachesView coaches={[]} unassignedMembers={[]} gymId="1" />)
    expect(screen.getByText(/no hay coaches en este gym/i)).toBeInTheDocument()
  })

  it('disables assign button when no unassigned members available', () => {
    render(
      <CoachesView
        coaches={[aCoach()]}
        unassignedMembers={[]}
        gymId="1"
      />
    )
    expect(screen.getByRole('button', { name: /asignar alumno/i })).toBeDisabled()
  })

  it('enables assign button when there are unassigned members', () => {
    render(
      <CoachesView
        coaches={[aCoach()]}
        unassignedMembers={[aGymMember()]}
        gymId="1"
      />
    )
    expect(screen.getByRole('button', { name: /asignar alumno/i })).toBeEnabled()
  })

  it('shows "todos los miembros tienen coach" message when no unassigned members', () => {
    render(
      <CoachesView
        coaches={[aCoach()]}
        unassignedMembers={[]}
        gymId="1"
      />
    )
    expect(screen.getByText(/todos los miembros ya tienen un coach/i)).toBeInTheDocument()
  })

  it('opens assign dialog with coach name in title on button click', async () => {
    const user = userEvent.setup()
    render(
      <CoachesView
        coaches={[aCoach({ fullName: 'Laura Coach' })]}
        unassignedMembers={[aGymMember()]}
        gymId="1"
      />
    )

    await user.click(screen.getByRole('button', { name: /asignar alumno/i }))

    expect(screen.getByText(/asignar alumno a Laura Coach/i)).toBeInTheDocument()
  })

  it('populates dialog select with available members', async () => {
    const user = userEvent.setup()
    render(
      <CoachesView
        coaches={[aCoach()]}
        unassignedMembers={[
          aGymMember({ userId: 20, fullName: 'Ana Miembro', email: 'ana@gym.com' }),
          aGymMember({ userId: 21, fullName: 'Pedro Test', email: 'pedro@gym.com', memberId: 2 }),
        ]}
        gymId="1"
      />
    )

    await user.click(screen.getByRole('button', { name: /asignar alumno/i }))

    expect(screen.getByRole('option', { name: /Ana Miembro/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Pedro Test/i })).toBeInTheDocument()
  })

  it('calls assignCoach with correct args and closes dialog on success', async () => {
    const user = userEvent.setup()
    render(
      <CoachesView
        coaches={[aCoach({ userId: 10 })]}
        unassignedMembers={[aGymMember({ userId: 20 })]}
        gymId="1"
      />
    )

    await user.click(screen.getByRole('button', { name: /asignar alumno/i }))

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, '20')

    await user.click(screen.getByRole('button', { name: /^asignar$/i }))

    await waitFor(() =>
      expect(assignCoach).toHaveBeenCalledWith('1', 10, 20)
    )
    await waitFor(() =>
      expect(screen.queryByText(/asignar alumno a/i)).not.toBeInTheDocument()
    )
  })

  it('shows error toast and keeps dialog open when assignCoach fails', async () => {
    assignCoach.mockResolvedValue({ success: false, error: 'El miembro ya tiene un coach asignado' })
    const user = userEvent.setup()
    render(
      <CoachesView
        coaches={[aCoach({ userId: 10 })]}
        unassignedMembers={[aGymMember({ userId: 20 })]}
        gymId="1"
      />
    )

    await user.click(screen.getByRole('button', { name: /asignar alumno/i }))
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, '20')
    await user.click(screen.getByRole('button', { name: /^asignar$/i }))

    await waitFor(() =>
      expect(screen.getByText('El miembro ya tiene un coach asignado')).toBeInTheDocument()
    )
    // Dialog still open
    expect(screen.getByRole('button', { name: /^asignar$/i })).toBeInTheDocument()
  })
})
