import { apiClient } from '@/lib/api/client'
import type { ApiResponse, ExerciseProgressDto } from '@/lib/api/types'
import { ExerciseProgressView } from '@/components/history/exercise-progress-view'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function CoachExerciseProgressPage({
  params,
}: {
  params: { gymId: string; memberId: string; assignmentId: string; exerciseId: string }
}) {
  let progress: ExerciseProgressDto | null = null

  try {
    const res = await apiClient<ApiResponse<ExerciseProgressDto>>(
      `/api/gyms/${params.gymId}/coach/history/${params.memberId}/assignments/${params.assignmentId}/exercises/${params.exerciseId}`
    )
    progress = res.data
  } catch {
    notFound()
  }

  if (!progress) notFound()

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link
        href={`/gym/${params.gymId}/coach/history/${params.memberId}/${params.assignmentId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={14} />
        {progress.blockName}
      </Link>

      <ExerciseProgressView progress={progress} />
    </div>
  )
}
