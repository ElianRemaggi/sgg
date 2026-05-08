import { apiClient } from '@/lib/api/client'
import type { ApiResponse, AssignmentHistoryDetailDto } from '@/lib/api/types'
import { AssignmentDetailView } from '@/components/history/assignment-detail-view'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function CoachAssignmentDetailPage({
  params,
}: {
  params: { gymId: string; memberId: string; assignmentId: string }
}) {
  let detail: AssignmentHistoryDetailDto | null = null

  try {
    const res = await apiClient<ApiResponse<AssignmentHistoryDetailDto>>(
      `/api/gyms/${params.gymId}/coach/history/${params.memberId}/assignments/${params.assignmentId}`
    )
    detail = res.data
  } catch {
    notFound()
  }

  if (!detail) notFound()

  const basePath = `/gym/${params.gymId}/coach/history/${params.memberId}`

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link
        href={basePath}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={14} />
        Historial
      </Link>

      <AssignmentDetailView detail={detail} basePath={basePath} />
    </div>
  )
}
