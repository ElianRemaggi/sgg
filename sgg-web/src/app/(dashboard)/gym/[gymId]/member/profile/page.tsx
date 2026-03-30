import { apiClient } from '@/lib/api/client'
import type { ApiResponse, UserDto, MembershipDto } from '@/lib/api/types'
import { ProfileView } from './profile-view'

export default async function MemberProfilePage({
  params,
}: {
  params: { gymId: string }
}) {
  const [userResult, membershipsResult] = await Promise.allSettled([
    apiClient<ApiResponse<UserDto>>('/api/users/me'),
    apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
  ])

  if (userResult.status === 'rejected') {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Perfil</h1>
        <div className="rounded-lg border bg-muted/50 p-6 text-center">
          <p className="text-muted-foreground">No se pudo cargar tu perfil.</p>
        </div>
      </div>
    )
  }

  const user = userResult.value.data

  const memberships =
    membershipsResult.status === 'fulfilled' ? membershipsResult.value.data : []

  const currentMembership =
    memberships.find(m => m.gymId === parseInt(params.gymId)) ?? null

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Perfil</h1>
      <ProfileView gymId={params.gymId} user={user} membership={currentMembership} />
    </div>
  )
}
