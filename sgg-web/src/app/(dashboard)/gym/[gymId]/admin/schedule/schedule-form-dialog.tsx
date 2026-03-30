'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import type { ScheduleActivityDto } from '@/lib/api/types'
import { createActivity, updateActivity } from './actions'

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

interface ScheduleFormDialogProps {
  gymId: string
  activity?: ScheduleActivityDto
  open: boolean
  onClose: () => void
}

export function ScheduleFormDialog({ gymId, activity, open, onClose }: ScheduleFormDialogProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(activity?.name ?? '')
  const [description, setDescription] = useState(activity?.description ?? '')
  const [dayOfWeek, setDayOfWeek] = useState(activity?.dayOfWeek?.toString() ?? '1')
  const [startTime, setStartTime] = useState(activity?.startTime ?? '')
  const [endTime, setEndTime] = useState(activity?.endTime ?? '')

  const isEdit = !!activity

  function handleSubmit() {
    if (!name.trim() || !startTime || !endTime) {
      toast('Completá todos los campos obligatorios', 'error')
      return
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateActivity(gymId, activity.id, data)
        : await createActivity(gymId, data)

      if (result.success) {
        toast(isEdit ? 'Actividad actualizada' : 'Actividad creada', 'success')
        onClose()
      } else {
        toast(result.error ?? 'Error al guardar', 'error')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar actividad' : 'Nueva actividad'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Yoga, CrossFit, Pilates"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Descripción</label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descripción opcional"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Día *</label>
            <Select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
              {DAYS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Hora inicio *</label>
              <Input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Hora fin *</label>
              <Input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
