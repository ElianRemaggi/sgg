import { apiClient } from '@/lib/api/client'
import type { ApiResponse, AssignmentHistorySummaryDto } from '@/lib/api/types'
import { HistoryListView } from '@/components/history/history-list-view'
import { History, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function CoachMemberHistoryPage({
  params,
}: {
  params: { gymId: string; memberId: string }
}) {
  let assignments: AssignmentHistorySummaryDto[] = []

  try {
    const res = await apiClient<ApiResponse<AssignmentHistorySummaryDto[]>>(
      `/api/gyms/${params.gymId}/coach/history/${params.memberId}/assignments`
    )
    assignments = res.data ?? []
  } catch {
    // Sin rutinas
  }

  const basePath = `/gym/${params.gymId}/coach/history/${params.memberId}`

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link
        href={`/gym/${params.gymId}/coach/my-members`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={14} />
        Mis miembros
      </Link>

      <div className="flex items-center gap-3">
        <History size={20} className="text-tertiary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Historial del miembro</h1>
          <p className="text-sm text-muted-foreground">Rutinas y progresión de peso</p>
        </div>
      </div>

      <HistoryListView assignments={assignments} basePath={basePath} />
    </div>
  )
}
