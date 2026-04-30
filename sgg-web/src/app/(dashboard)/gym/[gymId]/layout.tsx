import { apiClient } from '@/lib/api/client'
import type { ApiResponse, GymDto, MembershipDto } from '@/lib/api/types'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { SidebarShell } from '@/components/sidebar-shell'

export default async function GymLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { gymId: string }
}) {
  let gym: GymDto | null = null
  let userRole = 'MEMBER'

  try {
    const gymRes = await apiClient<ApiResponse<GymDto>>(`/api/gyms/${params.gymId}/info`)
    gym = gymRes.data

    const membershipsRes = await apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships')
    const membership = membershipsRes.data.find(
      m => m.gymId === Number(params.gymId) && m.status === 'ACTIVE'
    )
    if (membership) {
      userRole = membership.role
    } else {
      redirect('/select-gym')
    }
  } catch {
    redirect('/select-gym')
  }

  return (
    <SidebarShell
      sidebar={<Sidebar gymId={params.gymId} gymName={gym?.name ?? 'Gym'} role={userRole} />}
    >
      {children}
    </SidebarShell>
  )
}
