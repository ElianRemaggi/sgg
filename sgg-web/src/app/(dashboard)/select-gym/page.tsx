import { apiClient } from '@/lib/api/client'
import type { ApiResponse, MembershipDto } from '@/lib/api/types'
import { redirect } from 'next/navigation'
import { GymSelector } from './gym-selector'

export default async function SelectGymPage() {
  let memberships: MembershipDto[] = []

  try {
    const res = await apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships')
    memberships = res.data
  } catch {
    // If API fails, show empty state
  }

  // If only one active membership, redirect directly
  const activeMemberships = memberships.filter(m => m.status === 'ACTIVE')
  if (activeMemberships.length === 1) {
    const m = activeMemberships[0]
    const path = ['ADMIN', 'ADMIN_COACH'].includes(m.role)
      ? `/gym/${m.gymId}/admin/members`
      : `/gym/${m.gymId}/coach/templates`
    redirect(path)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-center">Seleccioná tu gym</h1>
        {memberships.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No tenés membresías activas.</p>
            <p className="mt-2 text-sm">Pedile al administrador de tu gym que te envíe el link de invitación.</p>
          </div>
        ) : (
          <GymSelector memberships={memberships} />
        )}
      </div>
    </div>
  )
}
