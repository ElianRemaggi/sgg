import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useGymStore } from '@/store/gymStore'
import { Screen } from '@/components/ui/Screen'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorScreen } from '@/components/ui/ErrorScreen'
import { Skeleton } from '@/components/ui/Skeleton'
import { RoutineProgressBar } from '@/components/routine/RoutineProgressBar'
import { BlockSection } from '@/components/routine/BlockSection'
import type { ApiResponse, ExerciseCompletionDto, MemberRoutineDto, TrackingProgressDto } from '@/types/api'

export default function RoutineScreen() {
  const { selectedGymId } = useGymStore()
  const gymId = selectedGymId!

  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const {
    data: routineData,
    isLoading: loadingRoutine,
    error: routineError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.memberRoutine(gymId),
    queryFn: () => apiClient<ApiResponse<MemberRoutineDto>>(`/api/gyms/${gymId}/member/routine`),
  })

  const { data: progressData } = useQuery({
    queryKey: queryKeys.memberProgress(gymId),
    queryFn: () => apiClient<ApiResponse<TrackingProgressDto>>(`/api/gyms/${gymId}/member/tracking/progress`),
    retry: false,
  })

  if (loadingRoutine) return <RoutineSkeleton />

  if (routineError) {
    if (routineError instanceof ApiError && routineError.status === 404) {
      return <EmptyState title="Sin rutina asignada" subtitle="Pedile a tu coach que te asigne una rutina." />
    }
    return <ErrorScreen message={routineError instanceof ApiError ? routineError.message : undefined} onRetry={refetch} />
  }

  const routine = routineData?.data
  if (!routine) {
    return <EmptyState title="Sin rutina asignada" subtitle="Pedile a tu coach que te asigne una rutina." />
  }

  const progress = progressData?.data ?? null
  const activeDay = selectedDay ?? (progress?.currentDayNumber ?? routine.blocks[0]?.dayNumber ?? 1)
  const activeBlock = routine.blocks.find((b) => b.dayNumber === activeDay) ?? routine.blocks[0]

  const completionMap = new Map<number, ExerciseCompletionDto>(
    (progress?.completions ?? []).map((c) => [c.exerciseId, c])
  )

  return (
    <Screen>
      <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerClassName="p-4 gap-4">
        {/* Header */}
        <View>
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">{routine.templateName}</Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Desde {new Date(routine.startsAt).toLocaleDateString('es-AR')}
            {routine.endsAt ? ` hasta ${new Date(routine.endsAt).toLocaleDateString('es-AR')}` : ''}
          </Text>
        </View>

        {progress && (
          <RoutineProgressBar
            routine={routine}
            progress={progress}
            selectedDay={activeDay}
            onSelectDay={(day) => setSelectedDay(day)}
          />
        )}

        {activeBlock && (
          <BlockSection
            gymId={gymId}
            assignmentId={routine.assignmentId}
            block={activeBlock}
            completionMap={completionMap}
            progress={progress}
          />
        )}
      </ScrollView>
    </Screen>
  )
}

function RoutineSkeleton() {
  return (
    <Screen>
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
        <View className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 gap-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-1/2" />
        </View>
        <View className="gap-2">
          {[1, 2, 3].map((i) => (
            <View key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex-row gap-3 items-center">
              <Skeleton className="h-6 w-6 rounded-full" />
              <View className="flex-1 gap-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  )
}
