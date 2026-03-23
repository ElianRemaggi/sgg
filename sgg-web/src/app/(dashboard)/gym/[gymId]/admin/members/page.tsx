import { apiClient } from '@/lib/api/client'
import type { ApiResponse, PageResponse, GymMemberDto } from '@/lib/api/types'
import { MembersView } from './members-view'

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: { gymId: string }
  searchParams: { status?: string; role?: string; page?: string; search?: string }
}) {
  const status = searchParams.status ?? 'ALL'
  const role = searchParams.role ?? 'ALL'
  const page = searchParams.page ?? '0'

  const res = await apiClient<ApiResponse<PageResponse<GymMemberDto>>>(
    `/api/gyms/${params.gymId}/admin/members?status=${status}&role=${role}&page=${page}&size=20`
  )

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Miembros</h1>
      <MembersView
        initialData={res.data}
        gymId={params.gymId}
        currentStatus={status}
        currentRole={role}
        currentSearch={searchParams.search ?? ''}
      />
    </div>
  )
}
