'use server'

import { apiClient, getErrorMessage } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
}

export async function createActivity(
  gymId: string,
  data: {
    name: string
    description?: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }
): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/admin/schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    revalidatePath(`/gym/${gymId}/admin/schedule`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateActivity(
  gymId: string,
  activityId: number,
  data: {
    name: string
    description?: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }
): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/admin/schedule/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    revalidatePath(`/gym/${gymId}/admin/schedule`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function deleteActivity(
  gymId: string,
  activityId: number
): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/admin/schedule/${activityId}`, {
      method: 'DELETE',
    })
    revalidatePath(`/gym/${gymId}/admin/schedule`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
