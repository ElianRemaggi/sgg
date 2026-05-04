'use client'

import { useState, useTransition } from 'react'
import { Check, ChevronDown, ChevronUp, Undo2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import type { TemplateExerciseDto, ExerciseCompletionDto } from '@/lib/api/types'
import { completeExercise, undoExercise } from './actions'

interface ExerciseRowProps {
  gymId: string
  assignmentId: number
  exercise: TemplateExerciseDto
  completion: ExerciseCompletionDto | undefined
}

export function ExerciseRow({ gymId, assignmentId, exercise, completion }: ExerciseRowProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [weightKg, setWeightKg] = useState<string>(completion?.weightKg?.toString() ?? '')
  const [actualReps, setActualReps] = useState<string>(completion?.actualReps?.toString() ?? '')
  const [notes, setNotes] = useState<string>(completion?.notes ?? '')

  const isCompleted = completion?.isCompleted === true
  const [confirmUndo, setConfirmUndo] = useState(false)

  function handleUndoClick() {
    if (!confirmUndo) {
      setConfirmUndo(true)
      setTimeout(() => setConfirmUndo(false), 3000)
    } else {
      setConfirmUndo(false)
      handleUndo()
    }
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeExercise(
        gymId,
        assignmentId,
        exercise.id,
        weightKg ? parseFloat(weightKg) : null,
        actualReps ? parseInt(actualReps) : null,
        notes || null
      )
      if (result.success) {
        setExpanded(false)
        toast('¡Ejercicio completado!', 'success')
      } else {
        toast(result.error ?? 'Error al completar', 'error')
      }
    })
  }

  function handleUndo() {
    startTransition(async () => {
      const result = await undoExercise(gymId, assignmentId, exercise.id)
      if (result.success) {
        toast('Ejercicio desmarcado', 'success')
      } else {
        toast(result.error ?? 'Error al deshacer', 'error')
      }
    })
  }

  return (
    <div
      className={`rounded-md border transition-colors ${
        isCompleted ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'border-border'
      }`}
    >
      {/* Header row — completed: block layout to avoid truncation on mobile */}
      {isCompleted ? (
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Check className="h-4 w-4 shrink-0 text-green-600" />
              <p className="text-sm font-medium truncate text-green-700 dark:text-green-400">
                {exercise.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndoClick}
              disabled={isPending}
              className={`h-7 px-2 shrink-0 ml-2 transition-colors ${
                confirmUndo ? 'text-destructive hover:text-destructive' : 'text-muted-foreground'
              }`}
            >
              <Undo2 className="h-3.5 w-3.5" />
              {confirmUndo && <span className="ml-1 text-xs">¿Confirmar?</span>}
            </Button>
          </div>
          <div className="ml-6 mt-1 flex flex-wrap items-center gap-1">
            <p className="text-xs text-muted-foreground">
              {exercise.sets ? `${exercise.sets} series` : ''}
              {exercise.sets && exercise.reps ? ' × ' : ''}
              {exercise.reps ? `${exercise.reps} reps` : ''}
              {exercise.restSeconds ? ` · ${exercise.restSeconds}s desc.` : ''}
            </p>
            {completion?.weightKg && (
              <Badge variant="secondary" className="text-xs">{completion.weightKg} kg</Badge>
            )}
            {completion?.actualReps && (
              <Badge variant="secondary" className="text-xs">{completion.actualReps} reps</Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{exercise.name}</p>
              <p className="text-xs text-muted-foreground">
                {exercise.sets ? `${exercise.sets} series` : ''}
                {exercise.sets && exercise.reps ? ' × ' : ''}
                {exercise.reps ? `${exercise.reps} reps` : ''}
                {exercise.restSeconds ? ` · ${exercise.restSeconds}s desc.` : ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(v => !v)}
            disabled={isPending}
            className="h-7 px-2 ml-2 shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Expanded form */}
      {expanded && !isCompleted && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Peso (kg)</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="Ej: 60"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Reps reales</label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 10"
                value={actualReps}
                onChange={e => setActualReps(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notas (opcional)</label>
            <Input
              type="text"
              placeholder="Ej: Buena forma, subir peso la próxima"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={isPending}
            className="w-full h-8"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            {isPending ? 'Guardando...' : 'Completar'}
          </Button>
        </div>
      )}
    </div>
  )
}
