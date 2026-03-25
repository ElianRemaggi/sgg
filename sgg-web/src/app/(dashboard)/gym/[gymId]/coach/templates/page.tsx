import { apiClient } from '@/lib/api/client'
import type { ApiResponse, RoutineTemplateSummaryDto } from '@/lib/api/types'
import { TemplatesView } from './templates-view'

export default async function TemplatesPage({
  params,
}: {
  params: { gymId: string }
}) {
  const res = await apiClient<ApiResponse<RoutineTemplateSummaryDto[]>>(
    `/api/gyms/${params.gymId}/coach/templates`
  )

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Plantillas de Rutina</h1>
      <TemplatesView templates={res.data} gymId={params.gymId} />
    </div>
  )
}
