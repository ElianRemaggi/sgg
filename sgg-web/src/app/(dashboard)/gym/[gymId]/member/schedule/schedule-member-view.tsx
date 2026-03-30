import { Badge } from '@/components/ui/badge'
import type { ScheduleActivityDto } from '@/lib/api/types'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface ScheduleMemberViewProps {
  activities: ScheduleActivityDto[]
}

export function ScheduleMemberView({ activities }: ScheduleMemberViewProps) {
  const byDay = DAYS.map((dayName, idx) => ({
    dayName,
    dayNum: idx + 1,
    activities: activities.filter(a => a.dayOfWeek === idx + 1),
  })).filter(d => d.activities.length > 0)

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <p className="text-muted-foreground">No hay actividades programadas en este gym.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {byDay.map(({ dayName, dayNum, activities: dayActivities }) => (
        <div key={dayNum} className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="font-semibold">{dayName}</h3>
          <div className="space-y-2">
            {dayActivities.map(activity => (
              <div key={activity.id} className="rounded-md border px-3 py-2">
                <p className="text-sm font-medium">{activity.name}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {activity.startTime} — {activity.endTime}
                </Badge>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
