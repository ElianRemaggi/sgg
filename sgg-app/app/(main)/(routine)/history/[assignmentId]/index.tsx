import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react-native'
import { apiClient, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useGymStore } from '@/store/gymStore'
import { Screen } from '@/components/ui/Screen'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorScreen } from '@/components/ui/ErrorScreen'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ApiResponse, AssignmentHistoryDetailDto, HistoryExerciseSummaryDto } from '@/types/api'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AssignmentDetailScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>()
  const { selectedGymId } = useGymStore()
  const gymId = selectedGymId!

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.assignmentDetail(gymId, assignmentId),
    queryFn: () =>
      apiClient<ApiResponse<AssignmentHistoryDetailDto>>(
        `/api/gyms/${gymId}/member/history/assignments/${assignmentId}`
      ),
  })

  if (isLoading) return <DetailSkeleton />

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState title="No encontrado" subtitle="No se pudo cargar el detalle de esta rutina." />
    }
    return <ErrorScreen onRetry={refetch} />
  }

  const detail = data?.data
  if (!detail) return <EmptyState title="Sin datos" subtitle="No se pudo cargar el detalle." />

  const { stats } = detail

  return (
    <Screen>
      <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerClassName="p-4 gap-4">
        {/* Header info */}
        <View>
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">{detail.templateName}</Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {formatDate(detail.startsAt)}
            {detail.endsAt ? ` – ${formatDate(detail.endsAt)}` : ''}
          </Text>
        </View>

        {/* Stats card */}
        <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-3">
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Resumen</Text>
          <View className="flex-row flex-wrap gap-x-6 gap-y-2">
            <StatItem label="Sesiones" value={String(stats.totalDistinctDays)} />
            <StatItem label="Completados" value={String(stats.totalCompletions)} />
            {stats.firstActivityAt && (
              <StatItem label="Primera sesión" value={formatDate(stats.firstActivityAt)} />
            )}
            {stats.lastActivityAt && (
              <StatItem label="Última sesión" value={formatDate(stats.lastActivityAt)} />
            )}
          </View>
        </View>

        {/* Blocks */}
        {detail.blocks.map((block) => (
          <View key={block.id} className="gap-2">
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Día {block.dayNumber} — {block.name}
            </Text>
            <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {block.exercises.map((exercise, idx) => (
                <ExerciseRow
                  key={exercise.exerciseId}
                  exercise={exercise}
                  isLast={idx === block.exercises.length - 1}
                  onPress={
                    exercise.sessionsCount > 0
                      ? () => router.push(
                          `/(main)/(routine)/history/${assignmentId}/exercise/${exercise.exerciseId}`
                        )
                      : undefined
                  }
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  )
}

function ExerciseRow({
  exercise,
  isLast,
  onPress,
}: {
  exercise: HistoryExerciseSummaryDto
  isLast: boolean
  onPress?: () => void
}) {
  const hasSessions = exercise.sessionsCount > 0

  const content = (
    <View
      className={[
        'flex-row items-center gap-3 px-4 py-3',
        !isLast ? 'border-b border-slate-100 dark:border-slate-800' : '',
        !hasSessions ? 'opacity-50' : '',
      ].join(' ')}
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-medium text-slate-900 dark:text-slate-50">{exercise.name}</Text>
        <View className="flex-row gap-3">
          {hasSessions ? (
            <>
              <Text className="text-xs text-slate-400 dark:text-slate-500">{exercise.sessionsCount} ses.</Text>
              {exercise.bestWeightKg != null && (
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Mejor: <Text className="font-medium text-slate-700 dark:text-slate-300">{exercise.bestWeightKg} kg</Text>
                </Text>
              )}
              {exercise.lastWeightKg != null && (
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Último: <Text className="font-medium text-slate-700 dark:text-slate-300">{exercise.lastWeightKg} kg</Text>
                </Text>
              )}
            </>
          ) : (
            <Text className="text-xs text-slate-400 dark:text-slate-500">Sin registros</Text>
          )}
        </View>
      </View>
      {hasSessions && <ChevronRight size={16} color="#94a3b8" />}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }
  return content
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5">
      <Text className="text-xs text-slate-400 dark:text-slate-500">{label}</Text>
      <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</Text>
    </View>
  )
}

function DetailSkeleton() {
  return (
    <Screen>
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-32" />
        <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-3">
          <Skeleton className="h-3 w-24" />
          <View className="flex-row gap-6">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="gap-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-12" />
              </View>
            ))}
          </View>
        </View>
        {[1, 2].map((i) => (
          <View key={i} className="gap-2">
            <Skeleton className="h-4 w-40" />
            <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-3">
              {[1, 2, 3].map((j) => (
                <View key={j} className="flex-row justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </Screen>
  )
}
