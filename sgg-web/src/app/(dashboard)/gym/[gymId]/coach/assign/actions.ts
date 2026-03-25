'use server'

import { apiClient, ApiError } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
  status?: number
}

export async function assignRoutine(
  gymId: string,
  data: {
    templateId: number
    memberUserId: number
    startsAt: string
    endsAt?: string | null
  }
): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/coach/assignments`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    revalidatePath(`/gym/${gymId}/coach/assign`)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.body.message, status: error.status }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
