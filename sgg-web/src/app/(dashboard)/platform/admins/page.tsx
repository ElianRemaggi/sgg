import { apiClient } from '@/lib/api/client'
import { ApiResponse, SuperAdminDto, UserDto } from '@/lib/api/types'
import { AdminsView } from './admins-view'

export default async function PlatformAdminsPage() {
  const [adminsRes, userRes] = await Promise.all([
    apiClient<ApiResponse<SuperAdminDto[]>>('/api/platform/admins'),
    apiClient<ApiResponse<UserDto>>('/api/users/me'),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Superadmins</h1>
      <AdminsView
        admins={adminsRes.data}
        currentUserId={userRes.data.id}
      />
    </div>
  )
}
