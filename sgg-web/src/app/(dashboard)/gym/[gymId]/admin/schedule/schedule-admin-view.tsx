'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import type { ScheduleActivityDto } from '@/lib/api/types'
import { ScheduleFormDialog } from './schedule-form-dialog'
import { deleteActivity } from './actions'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface ScheduleAdminViewProps {
  gymId: string
  activities: ScheduleActivityDto[]
}

export function ScheduleAdminView({ gymId, activities }: ScheduleAdminViewProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<ScheduleActivityDto | undefined>()

  const byDay = DAYS.map((dayName, idx) => ({
    dayName,
    dayNum: idx + 1,
    activities: activities.filter(a => a.dayOfWeek === idx + 1),
  }))

  function handleEdit(activity: ScheduleActivityDto) {
    setEditingActivity(activity)
    setDialogOpen(true)
  }

  function handleNew() {
    setEditingActivity(undefined)
    setDialogOpen(true)
  }

  function handleDelete(activity: ScheduleActivityDto) {
    startTransition(async () => {
      const result = await deleteActivity(gymId, activity.id)
      if (result.success) {
        toast('Actividad desactivada', 'success')
      } else {
        toast(result.error ?? 'Error al eliminar', 'error')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Horarios</h1>
        <Button onClick={handleNew} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva actividad
        </Button>
      </div>

      {activities.length === 0 && (
        <div className="rounded-lg border bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">No hay actividades programadas.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá la primera actividad para tu gym.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {byDay.map(({ dayName, dayNum, activities: dayActivities }) => {
          if (dayActivities.length === 0) return null
          return (
            <div key={dayNum} className="rounded-lg border bg-card p-3 space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {dayName}
              </h3>
              {dayActivities.map(activity => (
                <div
                  key={activity.id}
                  className="rounded-md border px-3 py-2 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{activity.name}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">
                      {activity.startTime} — {activity.endTime}
                    </Badge>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{activity.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleEdit(activity)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(activity)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <ScheduleFormDialog
        gymId={gymId}
        activity={editingActivity}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  )
}
