'use client'

import Link from 'next/link'
import { AssignmentHistoryDetailDto, HistoryExerciseSummaryDto } from '@/lib/api/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  detail: AssignmentHistoryDetailDto
  basePath: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ExerciseRow({ exercise, href }: { exercise: HistoryExerciseSummaryDto; href: string }) {
  const hasPeso = exercise.bestWeightKg !== null

  return (
    <Link href={href}>
      <div className={cn(
        'flex items-center justify-between py-3 px-1 rounded-lg',
        'hover:bg-surface-high transition-colors cursor-pointer group'
      )}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{exercise.name}</p>
          <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
            <span>{exercise.sessionsCount} sesión{exercise.sessionsCount !== 1 ? 'es' : ''}</span>
            {hasPeso && (
              <>
                <span className="text-tertiary">mejor: {exercise.bestWeightKg} kg</span>
                <span className="text-primary/70">último: {exercise.lastWeightKg} kg</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasPeso && exercise.sessionsCount > 1 && (
            <TrendingUp size={13} className="text-tertiary" />
          )}
          <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </Link>
  )
}

export function AssignmentDetailView({ detail, basePath }: Props) {
  const { stats } = detail

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-xl font-bold text-foreground">{detail.templateName}</h1>
          {detail.isActive && (
            <Badge variant="outline" className="border-tertiary/40 text-tertiary text-xs">Activa</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar size={12} />
          {formatDate(detail.startsAt)}
          {detail.endsAt ? ` → ${formatDate(detail.endsAt)}` : ' · sin vencimiento'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalDistinctDays}</div>
            <div className="text-xs text-muted-foreground mt-0.5">días entrenados</div>
          </CardContent>
        </Card>
        <Card className="border-tertiary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-tertiary">{stats.totalCompletions}</div>
            <div className="text-xs text-muted-foreground mt-0.5">completions</div>
          </CardContent>
        </Card>
        <Card className="border-secondary-vivid/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary-vivid">{detail.blocks.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">bloques</div>
          </CardContent>
        </Card>
      </div>

      {/* Blocks + exercises */}
      <div className="space-y-4">
        {detail.blocks.map(block => (
          <Card key={block.id} className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <span className="text-primary/60 font-mono text-xs">Día {block.dayNumber}</span>
                {block.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {block.exercises.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin ejercicios registrados</p>
              ) : (
                <div className="divide-y divide-border/40">
                  {block.exercises.map(exercise => (
                    <ExerciseRow
                      key={exercise.exerciseId}
                      exercise={exercise}
                      href={`${basePath}/${detail.id}/exercises/${exercise.exerciseId}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
