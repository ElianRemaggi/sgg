'use server'

import { revalidatePath } from 'next/cache'
import { apiClient, getErrorMessage } from '@/lib/api/client'

export async function suspendGym(gymId: number) {
  try {
    await apiClient(`/api/platform/gyms/${gymId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'SUSPENDED' }),
    })
    revalidatePath('/platform/gyms')
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function reactivateGym(gymId: number) {
  try {
    await apiClient(`/api/platform/gyms/${gymId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    })
    revalidatePath('/platform/gyms')
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function deleteGym(gymId: number, force: boolean = false) {
  try {
    await apiClient(`/api/platform/gyms/${gymId}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
    })
    revalidatePath('/platform/gyms')
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function createGymAction(data: {
  name: string
  slug: string
  description?: string
  logoUrl?: string
  routineCycle: string
  ownerUserId: number
}) {
  try {
    const res = await apiClient<{ data: { id: number } }>('/api/platform/gyms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    revalidatePath('/platform/gyms')
    return { success: true, gymId: res.data.id }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function searchUsersAction(search: string) {
  try {
    const res = await apiClient<{ data: { id: number; fullName: string; email: string }[] }>(
      `/api/platform/users?search=${encodeURIComponent(search)}`
    )
    return { success: true, users: res.data }
  } catch {
    return { success: false, users: [] }
  }
}

export async function updateGymAction(gymId: number, data: {
  name: string
  slug: string
  description?: string
  logoUrl?: string
  routineCycle: string
}) {
  try {
    await apiClient(`/api/platform/gyms/${gymId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    revalidatePath('/platform/gyms')
    revalidatePath(`/platform/gyms/${gymId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
