'use server'

import { revalidatePath } from 'next/cache'
import { apiClient, getErrorMessage } from '@/lib/api/client'
import type { ApiResponse, GymPublicDto, JoinRequestResponse } from '@/lib/api/types'

export async function searchGymsAction(query: string) {
  try {
    const res = await apiClient<ApiResponse<GymPublicDto[]>>(
      `/api/gyms/search/by-name?q=${encodeURIComponent(query)}`
    )
    return { success: true, gyms: res.data }
  } catch {
    return { success: false, gyms: [] }
  }
}

export async function joinGymAction(gymId: number) {
  try {
    const res = await apiClient<ApiResponse<JoinRequestResponse>>(
      `/api/gyms/${gymId}/join-request`,
      { method: 'POST' }
    )
    revalidatePath('/select-gym')
    return { success: true, data: res.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
