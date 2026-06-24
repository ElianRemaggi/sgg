import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../../../../../../tests/utils/render'
import { aAssignedMember } from '../../../../../../../../tests/utils/factories'
import { MyMembersView } from '../my-members-view'

describe('MyMembersView', () => {
  it('renders member full name', () => {
    render(
      <MyMembersView
        members={[aAssignedMember({ fullName: 'Juan Pérez' })]}
        gymId="1"
      />
    )
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('shows empty state when no members assigned', () => {
    render(<MyMembersView members={[]} gymId="1" />)
    expect(screen.getByText(/no tenés alumnos asignados/i)).toBeInTheDocument()
  })

  it('shows "Con rutina" badge when hasActiveRoutine is true', () => {
    render(
      <MyMembersView
        members={[aAssignedMember({ hasActiveRoutine: true })]}
        gymId="1"
      />
    )
    expect(screen.getByText(/con rutina/i)).toBeInTheDocument()
  })

  it('shows "Sin rutina" badge when hasActiveRoutine is false', () => {
    render(
      <MyMembersView
        members={[aAssignedMember({ hasActiveRoutine: false })]}
        gymId="1"
      />
    )
    expect(screen.getByText(/sin rutina/i)).toBeInTheDocument()
  })

  it('renders link to coach history for the member', () => {
    render(
      <MyMembersView
        members={[aAssignedMember({ userId: 42 })]}
        gymId="5"
      />
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/gym/5/coach/history/42')
  })

  it('renders multiple members', () => {
    render(
      <MyMembersView
        members={[
          aAssignedMember({ userId: 1, fullName: 'Ana García', assignmentId: 10 }),
          aAssignedMember({ userId: 2, fullName: 'Luis Torres', assignmentId: 11 }),
        ]}
        gymId="1"
      />
    )
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.getByText('Luis Torres')).toBeInTheDocument()
  })

  it('shows first letter of name as avatar initial', () => {
    render(
      <MyMembersView
        members={[aAssignedMember({ fullName: 'Martina López' })]}
        gymId="1"
      />
    )
    expect(screen.getByText('M')).toBeInTheDocument()
  })
})
