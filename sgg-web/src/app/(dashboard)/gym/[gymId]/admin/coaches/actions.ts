'use server'

import { apiClient, ApiError } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
  status?: number
}

export async function assignCoach(
  gymId: string,
  coachUserId: number,
  memberUserId: number
): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/admin/assign-coach`, {
      method: 'POST',
      body: JSON.stringify({ coachUserId, memberUserId }),
    })
    revalidatePath(`/gym/${gymId}/admin/coaches`)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.body.message, status: error.status }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

export async function unassignCoach(
  gymId: string,
  assignmentId: number
): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/admin/assign-coach/${assignmentId}`, {
      method: 'DELETE',
    })
    revalidatePath(`/gym/${gymId}/admin/coaches`)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.body.message, status: error.status }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
