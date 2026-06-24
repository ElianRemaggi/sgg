'use client'

import Link from 'next/link'
import type { AssignedMemberDto } from '@/lib/api/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Users, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface MyMembersViewProps {
  members: AssignedMemberDto[]
  gymId: string
}

export function MyMembersView({ members, gymId }: MyMembersViewProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <Users className="mb-3 h-10 w-10 opacity-40" />
        <p className="font-medium">No tenés alumnos asignados</p>
        <p className="text-sm">El administrador del gym debe asignarte miembros.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {members.map(member => (
        <Link
          key={member.userId}
          href={`/gym/${gymId}/coach/history/${member.userId}`}
          className="block"
        >
          <Card className="p-4 transition-colors hover:bg-surface-high cursor-pointer">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tertiary/10 text-tertiary font-semibold text-sm">
                  {member.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{member.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    Asignado hace{' '}
                    {formatDistanceToNow(new Date(member.assignedAt), {
                      locale: es,
                      addSuffix: false,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {member.hasActiveRoutine ? (
                  <Badge className="flex items-center gap-1 bg-green-500/10 text-green-400 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Con rutina
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Sin rutina
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
