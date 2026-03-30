'use server'

import { apiClient, getErrorMessage } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
}

export async function completeExercise(
  gymId: string,
  assignmentId: number,
  exerciseId: number,
  weightKg?: number | null,
  actualReps?: number | null,
  notes?: string | null
): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/member/tracking/complete`, {
      method: 'POST',
      body: JSON.stringify({ assignmentId, exerciseId, weightKg, actualReps, notes }),
    })
    revalidatePath(`/gym/${gymId}/member/routine`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function undoExercise(
  gymId: string,
  assignmentId: number,
  exerciseId: number
): Promise<ActionResult> {
  try {
    await apiClient(`/api/gyms/${gymId}/member/tracking/undo`, {
      method: 'POST',
      body: JSON.stringify({ assignmentId, exerciseId }),
    })
    revalidatePath(`/gym/${gymId}/member/routine`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
