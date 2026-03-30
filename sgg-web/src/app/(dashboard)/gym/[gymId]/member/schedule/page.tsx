import { apiClient } from '@/lib/api/client'
import type { ApiResponse, ScheduleActivityDto } from '@/lib/api/types'
import { ScheduleMemberView } from './schedule-member-view'

export default async function MemberSchedulePage({
  params,
}: {
  params: { gymId: string }
}) {
  let activities: ScheduleActivityDto[] = []

  try {
    const res = await apiClient<ApiResponse<ScheduleActivityDto[]>>(
      `/api/gyms/${params.gymId}/schedule`
    )
    activities = res.data
  } catch {
    activities = []
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Horarios</h1>
      <ScheduleMemberView activities={activities} />
    </div>
  )
}
