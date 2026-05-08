import { apiClient } from '@/lib/api/client'
import type { ApiResponse, AssignmentHistorySummaryDto } from '@/lib/api/types'
import { HistoryListView } from '@/components/history/history-list-view'
import { History } from 'lucide-react'

export default async function MemberHistoryPage({
  params,
}: {
  params: { gymId: string }
}) {
  let assignments: AssignmentHistorySummaryDto[] = []

  try {
    const res = await apiClient<ApiResponse<AssignmentHistorySummaryDto[]>>(
      `/api/gyms/${params.gymId}/member/history/assignments`
    )
    assignments = res.data ?? []
  } catch {
    // Sin rutinas aún
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <History size={20} className="text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Historial de rutinas</h1>
          <p className="text-sm text-muted-foreground">Todas tus rutinas y tu progresión de peso</p>
        </div>
      </div>

      <HistoryListView
        assignments={assignments}
        basePath={`/gym/${params.gymId}/member/history`}
      />
    </div>
  )
}
