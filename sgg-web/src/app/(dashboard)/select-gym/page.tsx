import { apiClient } from '@/lib/api/client'
import type { ApiResponse, MembershipDto, UserDto } from '@/lib/api/types'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { GymSelector } from './gym-selector'
import { GymSearch } from './gym-search'
import { LogoutButton } from './logout-button'
import { PersonalGymCreateButton } from './personal-gym-create-button'

export const dynamic = 'force-dynamic'

function getHomeForMembership(m: MembershipDto): string {
  if (['ADMIN', 'ADMIN_COACH'].includes(m.role)) {
    return `/gym/${m.gymId}/admin/members`
  } else if (m.role === 'COACH') {
    return `/gym/${m.gymId}/coach/templates`
  }
  return `/gym/${m.gymId}/member/routine`
}

export default async function SelectGymPage() {
  let memberships: MembershipDto[] = []
  let isSuperadmin = false
  let currentUser: UserDto | null = null

  try {
    const [membershipsRes, userRes] = await Promise.all([
      apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
      apiClient<ApiResponse<UserDto>>('/api/users/me'),
    ])
    memberships = membershipsRes.data
    currentUser = userRes.data
    isSuperadmin = userRes.data.platformRole === 'SUPERADMIN'
  } catch {
    // If API fails, show empty state
  }

  const activeMemberships = memberships.filter(m => m.status === 'ACTIVE')
  const standardMemberships = activeMemberships.filter(m => m.gymType !== 'PERSONAL')
  const personalMembership = activeMemberships.find(m => m.gymType === 'PERSONAL')

  if (!isSuperadmin && standardMemberships.length === 1) {
    redirect(getHomeForMembership(standardMemberships[0]))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-2xl p-6">
        {currentUser && (
          <p className="mb-2 text-center text-sm text-muted-foreground">
            Bienvenido, <span className="font-medium text-foreground">{currentUser.fullName}</span>
            <span className="ml-1 text-xs">({currentUser.email})</span>
          </p>
        )}
        <h1 className="mb-6 text-2xl font-bold text-center">Seleccioná tu gym</h1>

        {isSuperadmin && (
          <div className="mb-6 text-center">
            <Link
              href="/platform"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Panel Superadmin
            </Link>
          </div>
        )}

        {standardMemberships.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">Mis gyms</h2>
            <GymSelector memberships={standardMemberships} />
          </div>
        )}

        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Entrenamiento personal</h2>
          {personalMembership ? (
            <Link
              href={`/gym/${personalMembership.gymId}/member/routine`}
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-surface-high transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-vivid/20 text-secondary-vivid text-lg font-bold">
                🏋
              </div>
              <div>
                <p className="font-medium">Entrenamiento Personal</p>
                <p className="text-xs text-muted-foreground">Gestioná tus propias rutinas</p>
              </div>
            </Link>
          ) : (
            <PersonalGymCreateButton />
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="mb-3 text-lg font-semibold">Buscar gimnasio</h2>
          <GymSearch />
        </div>

        <div className="mt-8 text-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
