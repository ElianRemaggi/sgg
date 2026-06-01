'use server'

import { revalidatePath } from 'next/cache'
import { apiClient, getErrorMessage } from '@/lib/api/client'
import type { ApiResponse, UserSearchDto } from '@/lib/api/types'

export async function promoteUser(userId: number) {
  try {
    await apiClient(`/api/platform/admins/${userId}/promote`, { method: 'POST' })
    revalidatePath('/platform/admins')
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function demoteUser(userId: number) {
  try {
    await apiClient(`/api/platform/admins/${userId}/demote`, { method: 'POST' })
    revalidatePath('/platform/admins')
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function searchUsers(query: string): Promise<UserSearchDto[]> {
  if (!query || query.length < 2) return []
  try {
    const data = await apiClient<ApiResponse<UserSearchDto[]>>(
      `/api/platform/users?search=${encodeURIComponent(query)}`
    )
    return data.data
  } catch {
    return []
  }
}
