import { apiClient } from '@/lib/api/client'
import type { ApiResponse, ScheduleActivityDto } from '@/lib/api/types'
import { ScheduleAdminView } from './schedule-admin-view'

export default async function AdminSchedulePage({
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

  return <ScheduleAdminView gymId={params.gymId} activities={activities} />
}
