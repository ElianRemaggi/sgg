'use client'

import { useState } from 'react'
import { GymSummaryDto } from '@/lib/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  gym: GymSummaryDto
  onClose: () => void
  onDelete: (force: boolean) => void
  isPending: boolean
}

export function DeleteGymDialog({ gym, onClose, onDelete, isPending }: Props) {
  const [confirmation, setConfirmation] = useState('')
  const isConfirmed = confirmation === gym.slug

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar gym &quot;{gym.name}&quot;</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta accion es permanente. Escribi el slug del gym para confirmar:
          </p>

          {gym.membersCount > 0 && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-sm text-yellow-800">
                Este gym tiene <strong>{gym.membersCount}</strong> miembros activos.
              </p>
            </div>
          )}

          <Input
            placeholder={gym.slug}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={!isConfirmed || isPending}
            onClick={() => onDelete(gym.membersCount > 0)}
          >
            {isPending ? 'Eliminando...' : 'Eliminar permanentemente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
