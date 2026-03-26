'use server'

import { revalidatePath } from 'next/cache'
import { apiClient, getErrorMessage } from '@/lib/api/client'

export async function updateAutoAcceptAction(gymId: string, autoAccept: boolean) {
  try {
    await apiClient(`/api/gyms/${gymId}/settings/auto-accept`, {
      method: 'PATCH',
      body: JSON.stringify({ autoAccept }),
    })
    revalidatePath(`/gym/${gymId}/admin/settings`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
