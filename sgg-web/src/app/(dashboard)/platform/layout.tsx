import { redirect } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { ApiResponse, UserDto } from '@/lib/api/types'
import { PlatformSidebar } from '@/components/platform-sidebar'
import { SidebarShell } from '@/components/sidebar-shell'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user: UserDto
  try {
    const res = await apiClient<ApiResponse<UserDto>>('/api/users/me')
    user = res.data
  } catch {
    redirect('/login')
  }

  if (user.platformRole !== 'SUPERADMIN') {
    redirect('/select-gym')
  }

  return (
    <SidebarShell
      sidebar={<PlatformSidebar />}
      mainClassName="p-4 md:p-8"
    >
      {children}
    </SidebarShell>
  )
}
