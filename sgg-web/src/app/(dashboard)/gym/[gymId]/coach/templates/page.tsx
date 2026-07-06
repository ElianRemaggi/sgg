import { apiClient } from '@/lib/api/client'
import type { ApiResponse, MembershipDto, PageResponse, RoutineTemplateSummaryDto } from '@/lib/api/types'
import { TemplatesView } from './templates-view'

export default async function TemplatesPage({
  params,
  searchParams,
}: {
  params: { gymId: string }
  searchParams: { page?: string }
}) {
  const page = searchParams.page ?? '0'
  let isPersonalGym = false

  const [templatesRes, membershipsResult] = await Promise.allSettled([
    apiClient<ApiResponse<PageResponse<RoutineTemplateSummaryDto>>>(
      `/api/gyms/${params.gymId}/coach/templates?page=${page}&size=20`
    ),
    apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
  ])

  // La lista de plantillas es el contenido principal de la página: si falla, se deja
  // propagar al error boundary (gym/[gymId]/error.tsx).
  if (templatesRes.status === 'rejected') {
    throw templatesRes.reason
  }

  // Las membresías solo alimentan el flag isPersonalGym (cosmético) — degradar en silencio.
  if (membershipsResult.status === 'fulfilled') {
    const membership = membershipsResult.value.data.find(
      m => m.gymId === Number(params.gymId) && m.status === 'ACTIVE'
    )
    isPersonalGym = membership?.gymType === 'PERSONAL'
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        {isPersonalGym ? 'Mis Rutinas' : 'Plantillas de Rutina'}
      </h1>
      <TemplatesView data={templatesRes.value.data} gymId={params.gymId} isPersonalGym={isPersonalGym} />
    </div>
  )
}
