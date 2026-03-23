'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GymMemberDto } from '@/lib/api/types'
import { setMemberExpiry } from '../actions'

interface SetExpiryDialogProps {
  member: GymMemberDto | null
  gymId: string
  onClose: () => void
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function SetExpiryDialog({ member, gymId, onClose, onToast }: SetExpiryDialogProps) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const [date, setDate] = useState(member?.membershipExpiresAt?.split('T')[0] ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!member || !date) return
    setLoading(true)
    const expiresAt = `${date}T23:59:59`
    const result = await setMemberExpiry(gymId, member.memberId, expiresAt)
    setLoading(false)

    if (result.success) {
      onToast('Vencimiento actualizado', 'success')
      onClose()
    } else {
      onToast(result.error ?? 'Error al definir vencimiento', 'error')
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Definir vencimiento para {member?.fullName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={minDate}
          />
          <p className="text-sm text-muted-foreground">
            La membresía se marcará como expirada después de esta fecha.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !date}>
            {loading ? 'Guardando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
