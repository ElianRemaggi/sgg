import { useEffect, useRef, useState } from 'react'
import { TextInput, TouchableOpacity, View, Text } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { apiClient, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useToast } from '@/providers/ToastProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ExerciseCompletionDto, TemplateExerciseDto, TrackingProgressDto } from '@/types/api'

interface Props {
  gymId: string
  assignmentId: number
  exercise: TemplateExerciseDto
  completion: ExerciseCompletionDto | undefined
  previousNotes: string | null
}

interface CompletePayload {
  assignmentId: number
  exerciseId: number
  weightKg?: number
  actualReps?: number
  notes?: string
}

export function ExerciseRow({ gymId, assignmentId, exercise, completion, previousNotes }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [weightKg, setWeightKg] = useState(completion?.weightKg?.toString() ?? '')
  const [actualReps, setActualReps] = useState(completion?.actualReps?.toString() ?? '')
  const [notes, setNotes] = useState(completion?.notes ?? '')
  const [confirming, setConfirming] = useState(false)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queryClient = useQueryClient()
  const toast = useToast()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const completeMutation = useMutation({
    mutationFn: (payload: CompletePayload) =>
      apiClient(`/api/gyms/${gymId}/member/tracking/complete`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.memberProgress(gymId) })
      const snapshot = queryClient.getQueryData(queryKeys.memberProgress(gymId))
      queryClient.setQueryData(queryKeys.memberProgress(gymId), (old: TrackingProgressDto | undefined) => {
        if (!old) return old
        const filtered = old.completions.filter((c) => c.exerciseId !== payload.exerciseId)
        const newCompletion: ExerciseCompletionDto = {
          exerciseId: payload.exerciseId,
          isCompleted: true,
          weightKg: payload.weightKg ?? null,
          actualReps: payload.actualReps ?? null,
          notes: payload.notes ?? null,
          completedAt: new Date().toISOString(),
        }
        return {
          ...old,
          completions: [...filtered, newCompletion],
          completedToday: old.completedToday + 1,
        }
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(queryKeys.memberProgress(gymId), ctx?.snapshot)
      toast.error(_err instanceof ApiError ? _err.message : 'Error al completar el ejercicio')
    },
    onSuccess: () => {
      toast.success('¡Ejercicio completado!')
      setExpanded(false)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memberProgress(gymId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.memberRoutine(gymId) })
    },
  })

  const undoMutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/gyms/${gymId}/member/tracking/undo`, {
        method: 'POST',
        body: JSON.stringify({ assignmentId, exerciseId: exercise.id }),
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.memberProgress(gymId) })
      const snapshot = queryClient.getQueryData(queryKeys.memberProgress(gymId))
      queryClient.setQueryData(queryKeys.memberProgress(gymId), (old: TrackingProgressDto | undefined) => {
        if (!old) return old
        return {
          ...old,
          completions: old.completions.filter((c) => c.exerciseId !== exercise.id),
          completedToday: Math.max(0, old.completedToday - 1),
        }
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(queryKeys.memberProgress(gymId), ctx?.snapshot)
      toast.error('Error al deshacer')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memberProgress(gymId) })
    },
  })

  const handleUndo = () => {
    if (!confirming) {
      setConfirming(true)
      confirmTimer.current = setTimeout(() => setConfirming(false), 3000)
    } else {
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      setConfirming(false)
      undoMutation.mutate()
    }
  }

  useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current) }, [])

  const handleComplete = () => {
    completeMutation.mutate({
      assignmentId,
      exerciseId: exercise.id,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      actualReps: actualReps ? parseInt(actualReps, 10) : undefined,
      notes: notes.trim() || undefined,
    })
  }

  const isCompleted = completion?.isCompleted
  const chevronColor = isDark ? '#94a3b8' : '#64748b'
  const placeholderColor = isDark ? '#64748b' : '#94a3b8'

  return (
    <View className="border-b border-slate-100 dark:border-slate-800 py-3 last:border-b-0">
      {/* Collapsed row */}
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={() => !isCompleted && setExpanded((v) => !v)}
          className="flex-1 flex-row items-center gap-2"
          activeOpacity={0.7}
        >
          {isCompleted ? (
            <View className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center">
              <Check size={14} color="#16a34a" />
            </View>
          ) : (
            <View className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600" />
          )}

          <View className="flex-1">
            <Text className={['text-sm font-medium', isCompleted ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-slate-50'].join(' ')}>
              {exercise.name}
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500">
              {[exercise.sets && `${exercise.sets} series`, exercise.reps && exercise.reps].filter(Boolean).join(' × ')}
              {exercise.restSeconds ? ` • ${exercise.restSeconds}s descanso` : ''}
            </Text>
          </View>
        </TouchableOpacity>

        {isCompleted ? (
          <View className="flex-row gap-1 items-center">
            {completion?.weightKg && <Badge variant="secondary">{completion.weightKg} kg</Badge>}
            {completion?.actualReps && <Badge variant="secondary">{completion.actualReps} reps</Badge>}
            <Button
              variant={confirming ? 'destructive' : 'ghost'}
              size="sm"
              onPress={handleUndo}
              loading={undoMutation.isPending}
            >
              {confirming ? '¿Confirmar?' : 'Deshacer'}
            </Button>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setExpanded((v) => !v)} className="p-1">
            {expanded ? <ChevronUp size={18} color={chevronColor} /> : <ChevronDown size={18} color={chevronColor} />}
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded form */}
      {expanded && !isCompleted && (
        <View className="mt-3 gap-3">
          {previousNotes && (
            <View className="bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 rounded-lg px-3 py-2">
              <Text className="text-xs text-amber-800 dark:text-amber-300">
                <Text className="font-semibold">Observación: </Text>
                {previousNotes}
              </Text>
            </View>
          )}

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Peso (kg)</Text>
              <TextInput
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={placeholderColor}
                className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Reps reales</Text>
              <TextInput
                value={actualReps}
                onChangeText={setActualReps}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={placeholderColor}
                className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800"
              />
            </View>
          </View>

          <View>
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notas (opcional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej: subir 2.5 kg la próxima"
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={2}
              className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800 min-h-[56px]"
            />
          </View>

          <Button onPress={handleComplete} loading={completeMutation.isPending}>
            Completar
          </Button>
        </View>
      )}
    </View>
  )
}
