'use client'

import { useState } from 'react'
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

  const defaultDay = progress?.currentDayNumber ?? routine.blocks[0]?.dayNumber ?? 1
  const [selectedDay, setSelectedDay] = useState<number>(defaultDay)

  const activeBlock = routine.blocks.find(b => b.dayNumber === selectedDay) ?? routine.blocks[0]

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
            <div>
              <span className="font-medium">Día {progress.currentDayNumber} — {progress.currentBlockName}</span>
              <span className="ml-2 text-xs text-muted-foreground">hoy</span>
            </div>
            <span className="text-muted-foreground">
              {progress.completedToday} / {progress.totalExercisesToday} ejercicios
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{
                width: progress.totalExercisesToday > 0
                  ? `${Math.round(progress.completedToday / progress.totalExercisesToday * 100)}%`
                  : '0%'
              }}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Rutina total: {progress.completedTotal}/{progress.totalExercises} ({progress.progressPercent}%)</span>
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

      {/* Day tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {routine.blocks.map(block => {
          const isToday = progress?.currentDayNumber === block.dayNumber
          const isSelected = selectedDay === block.dayNumber
          return (
            <button
              key={block.dayNumber}
              onClick={() => setSelectedDay(block.dayNumber)}
              className={[
                'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
                isToday && !isSelected ? 'ring-2 ring-green-500 ring-offset-1' : '',
              ].join(' ')}
            >
              Día {block.dayNumber}
              {isToday && (
                <span className="ml-1.5 text-[10px] font-normal opacity-80">● hoy</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active block */}
      {activeBlock && (
        <Card className={progress?.currentDayNumber === activeBlock.dayNumber ? 'border-green-500 shadow-sm' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Día {activeBlock.dayNumber} — {activeBlock.name}
              {progress?.currentDayNumber === activeBlock.dayNumber && (
                <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  hoy
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeBlock.exercises.map(exercise => (
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
      )}
    </div>
  )
}
