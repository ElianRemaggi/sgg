import { apiClient } from '@/lib/api/client'
import type { ApiResponse, MembershipDto, RoutineTemplateSummaryDto } from '@/lib/api/types'
import { TemplatesView } from './templates-view'

export default async function TemplatesPage({
  params,
}: {
  params: { gymId: string }
}) {
  const [templatesRes, membershipsRes] = await Promise.all([
    apiClient<ApiResponse<RoutineTemplateSummaryDto[]>>(
      `/api/gyms/${params.gymId}/coach/templates`
    ),
    apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
  ])

  const membership = membershipsRes.data.find(
    m => m.gymId === Number(params.gymId) && m.status === 'ACTIVE'
  )
  const isPersonalGym = membership?.gymType === 'PERSONAL'

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        {isPersonalGym ? 'Mis Rutinas' : 'Plantillas de Rutina'}
      </h1>
      <TemplatesView templates={templatesRes.data} gymId={params.gymId} isPersonalGym={isPersonalGym} />
    </div>
  )
}
