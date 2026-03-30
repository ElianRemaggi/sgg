import { apiClient } from '@/lib/api/client'
import type { ApiResponse, MemberRoutineDto, TrackingProgressDto } from '@/lib/api/types'
import { RoutineTrackingView } from './routine-tracking-view'

export default async function MemberRoutinePage({
  params,
}: {
  params: { gymId: string }
}) {
  let routine: MemberRoutineDto | null = null
  let progress: TrackingProgressDto | null = null
  let error: string | null = null

  const [routineResult, progressResult] = await Promise.allSettled([
    apiClient<ApiResponse<MemberRoutineDto>>(`/api/gyms/${params.gymId}/member/routine`),
    apiClient<ApiResponse<TrackingProgressDto>>(`/api/gyms/${params.gymId}/member/tracking/progress`),
  ])

  if (routineResult.status === 'fulfilled') {
    routine = routineResult.value.data
  } else {
    error = 'No tenés una rutina asignada actualmente.'
  }

  if (progressResult.status === 'fulfilled') {
    progress = progressResult.value.data
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Mi Rutina</h1>

      {error && (
        <div className="rounded-lg border bg-muted/50 p-6 text-center">
          <p className="text-muted-foreground">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu coach te asignará una rutina pronto.
          </p>
        </div>
      )}

      {routine && (
        <RoutineTrackingView
          gymId={params.gymId}
          routine={routine}
          progress={progress}
        />
      )}
    </div>
  )
}
