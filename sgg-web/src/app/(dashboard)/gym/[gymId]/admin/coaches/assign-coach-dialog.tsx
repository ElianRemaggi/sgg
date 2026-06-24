'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { CoachSummaryDto, GymMemberDto } from '@/lib/api/types'
import { assignCoach } from './actions'
import { useToast } from '@/components/ui/toast'

interface AssignCoachDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gymId: string
  coach: CoachSummaryDto
  members: GymMemberDto[]
}

export function AssignCoachDialog({
  open,
  onOpenChange,
  gymId,
  coach,
  members,
}: AssignCoachDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleSubmit() {
    if (!selectedMemberId) return
    startTransition(async () => {
      const result = await assignCoach(gymId, coach.userId, Number(selectedMemberId))
      if (result.success) {
        toast('Coach asignado correctamente', 'success')
        setSelectedMemberId('')
        onOpenChange(false)
      } else {
        toast(result.error ?? 'Error al asignar coach', 'error')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar alumno a {coach.fullName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccioná un miembro</label>
            <Select
              value={selectedMemberId}
              onChange={e => setSelectedMemberId(e.target.value)}
            >
              <option value="">Elegir miembro...</option>
              {members.map(m => (
                <option key={m.userId} value={String(m.userId)}>
                  {m.fullName} — {m.email}
                </option>
              ))}
            </Select>
          </div>

          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay miembros activos disponibles.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Si el miembro ya tiene un coach asignado se mostrará un error.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedMemberId || isPending}>
            {isPending ? 'Asignando...' : 'Asignar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
