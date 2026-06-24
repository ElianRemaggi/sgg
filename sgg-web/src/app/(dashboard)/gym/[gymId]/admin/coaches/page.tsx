import { apiClient } from '@/lib/api/client'
import type { ApiResponse, CoachSummaryDto, PageResponse, GymMemberDto } from '@/lib/api/types'
import { CoachesView } from './coaches-view'

export default async function CoachesPage({
  params,
}: {
  params: { gymId: string }
}) {
  const [coachesRes, membersRes] = await Promise.all([
    apiClient<ApiResponse<CoachSummaryDto[]>>(
      `/api/gyms/${params.gymId}/admin/coaches`
    ),
    apiClient<ApiResponse<PageResponse<GymMemberDto>>>(
      `/api/gyms/${params.gymId}/admin/members?status=ACTIVE&role=MEMBER&size=200`
    ),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Coaches</h1>
      <CoachesView
        coaches={coachesRes.data}
        unassignedMembers={membersRes.data.content}
        gymId={params.gymId}
      />
    </div>
  )
}
