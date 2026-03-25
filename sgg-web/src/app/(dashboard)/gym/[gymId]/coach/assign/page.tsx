import { apiClient } from '@/lib/api/client'
import type { ApiResponse, RoutineTemplateSummaryDto, PageResponse, GymMemberDto } from '@/lib/api/types'
import { AssignView } from './assign-view'

export default async function AssignPage({
  params,
}: {
  params: { gymId: string }
}) {
  const [templatesRes, membersRes] = await Promise.all([
    apiClient<ApiResponse<RoutineTemplateSummaryDto[]>>(
      `/api/gyms/${params.gymId}/coach/templates`
    ),
    apiClient<ApiResponse<PageResponse<GymMemberDto>>>(
      `/api/gyms/${params.gymId}/admin/members?status=ACTIVE&role=MEMBER&size=100`
    ),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Asignar Rutina</h1>
      <AssignView
        templates={templatesRes.data}
        members={membersRes.data.content}
        gymId={params.gymId}
      />
    </div>
  )
}
