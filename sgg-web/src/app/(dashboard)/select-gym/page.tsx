import { apiClient } from '@/lib/api/client'
import type { ApiResponse, MembershipDto, UserDto } from '@/lib/api/types'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { GymSelector } from './gym-selector'
import { GymSearch } from './gym-search'
import { LogoutButton } from './logout-button'

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

  try {
    const [membershipsRes, userRes] = await Promise.all([
      apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
      apiClient<ApiResponse<UserDto>>('/api/users/me'),
    ])
    memberships = membershipsRes.data
    isSuperadmin = userRes.data.platformRole === 'SUPERADMIN'
  } catch {
    // If API fails, show empty state
  }

  const activeMemberships = memberships.filter(m => m.status === 'ACTIVE')
  if (!isSuperadmin && activeMemberships.length === 1) {
    redirect(getHomeForMembership(activeMemberships[0]))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-2xl p-6">
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

        {memberships.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">Mis gyms</h2>
            <GymSelector memberships={memberships} />
          </div>
        )}

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
