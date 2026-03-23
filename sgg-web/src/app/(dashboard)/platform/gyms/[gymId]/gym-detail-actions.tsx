'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { GymDetailDto } from '@/lib/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { suspendGym, reactivateGym, deleteGym } from '../actions'

interface Props {
  gym: GymDetailDto
}

export function GymDetailActions({ gym }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [deleteSlug, setDeleteSlug] = useState('')

  async function handleStatusChange() {
    startTransition(async () => {
      const result = gym.status === 'ACTIVE'
        ? await suspendGym(gym.id)
        : await reactivateGym(gym.id)

      if (result.success) {
        toast(`Gym ${gym.status === 'ACTIVE' ? 'suspendido' : 'reactivado'}`, 'success')
        router.refresh()
      } else {
        toast(result.error ?? 'Error', 'error')
      }
    })
  }

  async function handleDelete() {
    startTransition(async () => {
      const force = gym.stats.activeMembers > 0
      const result = await deleteGym(gym.id, force)
      if (result.success) {
        toast('Gym eliminado', 'success')
        router.push('/platform/gyms')
      } else {
        toast(result.error ?? 'Error', 'error')
      }
    })
  }

  if (gym.status === 'DELETED') return null

  return (
    <Card className="mt-6 border-destructive/20">
      <CardHeader>
        <CardTitle className="text-destructive">Zona de peligro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(gym.status === 'ACTIVE' || gym.status === 'SUSPENDED') && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {gym.status === 'ACTIVE' ? 'Suspender gym' : 'Reactivar gym'}
              </p>
              <p className="text-sm text-muted-foreground">
                {gym.status === 'ACTIVE'
                  ? 'Los miembros perderan acceso hasta que lo reactives.'
                  : 'Los miembros recuperaran acceso al gym.'}
              </p>
            </div>
            <Button
              variant={gym.status === 'ACTIVE' ? 'outline' : 'default'}
              onClick={handleStatusChange}
              disabled={isPending}
            >
              {gym.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
            </Button>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="font-medium">Eliminar gym</p>
          <p className="mb-3 text-sm text-muted-foreground">
            Escribi <code className="bg-muted px-1 rounded">{gym.slug}</code> para confirmar.
          </p>
          {gym.stats.activeMembers > 0 && (
            <p className="mb-3 text-sm text-yellow-700 bg-yellow-50 rounded p-2">
              Este gym tiene {gym.stats.activeMembers} miembros activos.
            </p>
          )}
          <div className="flex gap-3">
            <Input
              value={deleteSlug}
              onChange={(e) => setDeleteSlug(e.target.value)}
              placeholder={gym.slug}
              className="max-w-xs"
            />
            <Button
              variant="destructive"
              disabled={deleteSlug !== gym.slug || isPending}
              onClick={handleDelete}
            >
              Eliminar permanentemente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
