'use server'

import { apiClient, ApiError } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
  status?: number
}

export async function approveMember(gymId: string, memberId: number): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/approve`, { method: 'PUT' })
    revalidatePath(`/gym/${gymId}/admin/members`)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.body.message, status: error.status }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

export async function rejectMember(gymId: string, memberId: number): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/reject`, { method: 'PUT' })
    revalidatePath(`/gym/${gymId}/admin/members`)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.body.message, status: error.status }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

export async function blockMember(gymId: string, memberId: number): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/block`, { method: 'PUT' })
    revalidatePath(`/gym/${gymId}/admin/members`)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.body.message, status: error.status }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

export async function changeMemberRole(gymId: string, memberId: number, role: string): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
    revalidatePath(`/gym/${gymId}/admin/members`)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.body.message, status: error.status }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

export async function setMemberExpiry(gymId: string, memberId: number, expiresAt: string): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/expiry`, {
      method: 'PUT',
      body: JSON.stringify({ expiresAt }),
    })
    revalidatePath(`/gym/${gymId}/admin/members`)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.body.message, status: error.status }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
