'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/browser'
import type { ApiResponse } from '@/lib/api/types'

export function PersonalGymCreateButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    setLoading(true)
    try {
      const res = await apiClient<ApiResponse<{ gymId: number }>>('/api/users/me/personal-gym', {
        method: 'POST',
      })
      router.push(`/gym/${res.data.gymId}/member/routine`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-lg border border-dashed p-4 hover:bg-surface-high transition-colors disabled:opacity-50 text-left"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-vivid/10 text-secondary-vivid text-lg font-bold">
        +
      </div>
      <div>
        <p className="font-medium">{loading ? 'Creando...' : 'Empezar entrenamiento personal'}</p>
        <p className="text-xs text-muted-foreground">Creá y gestioná tus propias rutinas</p>
      </div>
    </button>
  )
}
