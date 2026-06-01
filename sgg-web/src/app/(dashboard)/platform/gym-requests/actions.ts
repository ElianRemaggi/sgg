'use server'

import { revalidatePath } from 'next/cache'
import { apiClient, getErrorMessage } from '@/lib/api/client'

export async function updateGymRequestStatus(id: number, status: string) {
  try {
    await apiClient(`/api/platform/gym-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    revalidatePath('/platform/gym-requests')
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
