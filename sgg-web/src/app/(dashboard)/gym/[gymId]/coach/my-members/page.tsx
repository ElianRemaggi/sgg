import { apiClient } from '@/lib/api/client'
import type { ApiResponse, AssignedMemberDto } from '@/lib/api/types'
import { MyMembersView } from './my-members-view'

export default async function MyMembersPage({
  params,
}: {
  params: { gymId: string }
}) {
  const res = await apiClient<ApiResponse<AssignedMemberDto[]>>(
    `/api/gyms/${params.gymId}/coach/my-members`
  )

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Mis Alumnos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {res.data.length} {res.data.length === 1 ? 'alumno asignado' : 'alumnos asignados'}
      </p>
      <MyMembersView members={res.data} gymId={params.gymId} />
    </div>
  )
}
