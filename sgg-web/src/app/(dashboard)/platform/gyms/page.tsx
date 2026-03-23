import { apiClient } from '@/lib/api/client'
import { ApiResponse, PageResponse, GymSummaryDto } from '@/lib/api/types'
import { GymsView } from './gyms-view'

interface Props {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function PlatformGymsPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status || ''
  const search = params.search || ''
  const page = params.page || '0'

  const queryParams = new URLSearchParams()
  if (status) queryParams.set('status', status)
  if (search) queryParams.set('search', search)
  queryParams.set('page', page)
  queryParams.set('size', '20')

  const res = await apiClient<ApiResponse<PageResponse<GymSummaryDto>>>(
    `/api/platform/gyms?${queryParams.toString()}`
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gimnasios</h1>
      </div>
      <GymsView data={res.data} currentStatus={status} currentSearch={search} />
    </div>
  )
}
