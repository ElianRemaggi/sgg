'use client'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import type { GymMemberDto } from '@/lib/api/types'
import { approveMember, rejectMember, blockMember } from './actions'

interface MemberActionsProps {
  member: GymMemberDto
  gymId: string
  onChangeRole: () => void
  onSetExpiry: () => void
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function MemberActions({ member, gymId, onChangeRole, onSetExpiry, onToast }: MemberActionsProps) {
  async function handleApprove() {
    const result = await approveMember(gymId, member.memberId)
    if (result.success) {
      onToast('Miembro aprobado', 'success')
    } else {
      onToast(result.error ?? 'Error al aprobar', 'error')
    }
  }

  async function handleReject() {
    const result = await rejectMember(gymId, member.memberId)
    if (result.success) {
      onToast('Solicitud rechazada', 'success')
    } else {
      onToast(result.error ?? 'Error al rechazar', 'error')
    }
  }

  async function handleBlock() {
    const result = await blockMember(gymId, member.memberId)
    if (result.success) {
      onToast('Miembro bloqueado', 'success')
    } else {
      onToast(result.error ?? 'Error al bloquear', 'error')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-md p-1 hover:bg-accent">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {member.status === 'PENDING' && (
          <>
            <DropdownMenuItem onClick={handleApprove}>Aprobar</DropdownMenuItem>
            <DropdownMenuItem onClick={handleReject}>Rechazar</DropdownMenuItem>
          </>
        )}
        {member.status === 'ACTIVE' && (
          <>
            <DropdownMenuItem onClick={onChangeRole}>Cambiar rol</DropdownMenuItem>
            <DropdownMenuItem onClick={onSetExpiry}>Definir vencimiento</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBlock} className="text-red-600">Bloquear</DropdownMenuItem>
          </>
        )}
        {member.status === 'BLOCKED' && (
          <DropdownMenuItem onClick={handleApprove}>Desbloquear</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
