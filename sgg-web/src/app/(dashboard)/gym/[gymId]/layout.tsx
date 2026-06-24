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
  let gymName = 'Gym'
  let userRole = 'MEMBER'
  let isPersonalGym = false

  try {
    const membershipsRes = await apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships')
    const membership = membershipsRes.data.find(
      m => m.gymId === Number(params.gymId) && m.status === 'ACTIVE'
    )
    if (!membership) {
      redirect('/select-gym')
    }

    userRole = membership.role
    gymName = membership.gymName
    isPersonalGym = membership.gymType === 'PERSONAL'

    if (!isPersonalGym) {
      const gymRes = await apiClient<ApiResponse<GymDto>>(`/api/gyms/${params.gymId}/info`)
      gymName = gymRes.data.name
    }
  } catch {
    redirect('/select-gym')
  }

  return (
    <SidebarShell
      sidebar={
        <Sidebar
          gymId={params.gymId}
          gymName={gymName}
          role={userRole}
          isPersonalGym={isPersonalGym}
        />
      }
    >
      {children}
    </SidebarShell>
  )
}
