import { apiClient } from '@/lib/api/client'
import { ApiResponse, PageResponse, GymRequestDto } from '@/lib/api/types'
import { GymRequestsView } from './gym-requests-view'

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function PlatformGymRequestsPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status || ''
  const page = params.page || '0'

  const queryParams = new URLSearchParams()
  if (status) queryParams.set('status', status)
  queryParams.set('page', page)
  queryParams.set('size', '20')

  const res = await apiClient<ApiResponse<PageResponse<GymRequestDto>>>(
    `/api/platform/gym-requests?${queryParams.toString()}`
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Solicitudes de Gimnasio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Solicitudes de acceso enviadas desde la landing page.
        </p>
      </div>
      <GymRequestsView data={res.data} currentStatus={status} />
    </div>
  )
}
