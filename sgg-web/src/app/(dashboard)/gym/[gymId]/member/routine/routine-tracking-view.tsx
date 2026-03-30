'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MemberRoutineDto, TrackingProgressDto, ExerciseCompletionDto } from '@/lib/api/types'
import { ExerciseRow } from './exercise-row'

interface RoutineTrackingViewProps {
  gymId: string
  routine: MemberRoutineDto
  progress: TrackingProgressDto | null
}

export function RoutineTrackingView({ gymId, routine, progress }: RoutineTrackingViewProps) {
  const completionMap = new Map<number, ExerciseCompletionDto>(
    (progress?.completions ?? []).map(c => [c.exerciseId, c])
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">{routine.templateName}</h2>
        <Badge variant="secondary">
          {new Date(routine.startsAt).toLocaleDateString('es-AR')}
          {routine.endsAt && ` — ${new Date(routine.endsAt).toLocaleDateString('es-AR')}`}
        </Badge>
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progreso de hoy</span>
            <span className="text-muted-foreground">
              {progress.completedTotal} / {progress.totalExercises} ejercicios
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Hoy: {progress.completedToday} completados</span>
            <span>Total: {progress.progressPercent}%</span>
            {progress.lastActivityAt && (
              <span>
                Último: {new Date(progress.lastActivityAt).toLocaleTimeString('es-AR', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Blocks */}
      <div className="grid gap-4">
        {routine.blocks.map(block => (
          <Card key={block.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Día {block.dayNumber} — {block.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {block.exercises.map(exercise => (
                  <ExerciseRow
                    key={exercise.id}
                    gymId={gymId}
                    assignmentId={routine.assignmentId}
                    exercise={exercise}
                    completion={completionMap.get(exercise.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
