import { apiClient } from '@/lib/api/client'
import type { ApiResponse, GymDto } from '@/lib/api/types'
import { AutoAcceptToggle } from './auto-accept-toggle'

export default async function SettingsPage({
  params,
}: {
  params: { gymId: string }
}) {
  const res = await apiClient<ApiResponse<GymDto>>(
    `/api/gyms/${params.gymId}/info`
  )

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Configuración</h1>
      <div className="max-w-lg space-y-6">
        <AutoAcceptToggle
          gymId={params.gymId}
          initialValue={res.data.autoAcceptMembers}
        />
      </div>
    </div>
  )
}
