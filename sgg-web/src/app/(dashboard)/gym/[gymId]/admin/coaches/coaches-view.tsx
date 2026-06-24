'use client'

import { useState } from 'react'
import type { CoachSummaryDto, GymMemberDto } from '@/lib/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AssignCoachDialog } from './assign-coach-dialog'
import { UserPlus, Users } from 'lucide-react'

interface CoachesViewProps {
  coaches: CoachSummaryDto[]
  unassignedMembers: GymMemberDto[]
  gymId: string
}

export function CoachesView({ coaches, unassignedMembers, gymId }: CoachesViewProps) {
  const [dialogCoach, setDialogCoach] = useState<CoachSummaryDto | null>(null)

  if (coaches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <Users className="mb-3 h-10 w-10 opacity-40" />
        <p className="font-medium">No hay coaches en este gym</p>
        <p className="text-sm">Ascendé un miembro al rol de Coach desde la sección Miembros.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {coaches.map(coach => (
          <Card key={coach.userId} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{coach.fullName}</p>
                  <Badge variant="secondary">
                    {coach.assignedMembersCount}{' '}
                    {coach.assignedMembersCount === 1 ? 'alumno' : 'alumnos'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{coach.email}</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => setDialogCoach(coach)}
                disabled={unassignedMembers.length === 0}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Asignar alumno
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {unassignedMembers.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Todos los miembros ya tienen un coach asignado.
        </p>
      )}

      {dialogCoach && (
        <AssignCoachDialog
          open={!!dialogCoach}
          onOpenChange={open => !open && setDialogCoach(null)}
          gymId={gymId}
          coach={dialogCoach}
          members={unassignedMembers}
        />
      )}
    </>
  )
}
