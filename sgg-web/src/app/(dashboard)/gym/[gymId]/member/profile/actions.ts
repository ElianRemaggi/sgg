'use server'

import { apiClient, getErrorMessage } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
}

export async function updateProfile(
  gymId: string,
  data: { fullName: string; avatarUrl?: string | null }
): Promise<ActionResult> {
  try {
    await apiClient(`/api/users/me`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    revalidatePath(`/gym/${gymId}/member/profile`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
