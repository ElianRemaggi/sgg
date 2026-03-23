'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { GymMemberDto } from '@/lib/api/types'
import { changeMemberRole } from '../actions'

interface ChangeRoleDialogProps {
  member: GymMemberDto | null
  gymId: string
  onClose: () => void
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  MEMBER: 'Solo puede ver su rutina y registrar progreso',
  COACH: 'Puede crear rutinas y asignarlas a sus alumnos',
  ADMIN: 'Gestiona miembros, coaches y configuración del gym',
  ADMIN_COACH: 'Combina permisos de Admin y Coach',
}

export function ChangeRoleDialog({ member, gymId, onClose, onToast }: ChangeRoleDialogProps) {
  const [role, setRole] = useState(member?.role ?? 'MEMBER')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!member) return
    setLoading(true)
    const result = await changeMemberRole(gymId, member.memberId, role)
    setLoading(false)

    if (result.success) {
      onToast('Rol actualizado', 'success')
      onClose()
    } else {
      onToast(result.error ?? 'Error al cambiar rol', 'error')
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar rol de {member?.fullName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select value={role} onChange={e => setRole(e.target.value)}>
            <option value="MEMBER">Miembro</option>
            <option value="COACH">Coach</option>
            <option value="ADMIN">Admin</option>
            <option value="ADMIN_COACH">Admin + Coach</option>
          </Select>
          <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || role === member?.role}>
            {loading ? 'Guardando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
