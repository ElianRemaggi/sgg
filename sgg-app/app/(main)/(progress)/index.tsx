import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react-native'
import { apiClient, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useGymStore } from '@/store/gymStore'
import { Screen } from '@/components/ui/Screen'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorScreen } from '@/components/ui/ErrorScreen'
import { Skeleton } from '@/components/ui/Skeleton'
import { ProgressRing } from '@/components/routine/ProgressRing'
import type { ApiResponse, TrackingProgressDto } from '@/types/api'

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace unos segundos'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.floor(hours / 24)} días`
}

export default function ProgressScreen() {
  const { selectedGymId } = useGymStore()
  const gymId = selectedGymId!

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.memberProgress(gymId),
    queryFn: () => apiClient<ApiResponse<TrackingProgressDto>>(`/api/gyms/${gymId}/member/tracking/progress`),
    refetchOnWindowFocus: true,
  })

  if (isLoading) return <ProgressSkeleton />

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState title="Sin datos de progreso" subtitle="Cuando tu coach te asigne una rutina, verás tu progreso acá." />
    }
    return <ErrorScreen onRetry={refetch} />
  }

  const progress = data?.data
  if (!progress) {
    return <EmptyState title="Sin datos de progreso" subtitle="Cuando tu coach te asigne una rutina, verás tu progreso acá." />
  }

  const pending = progress.totalExercises - progress.completedTotal

  return (
    <Screen>
      <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerClassName="p-4 gap-5">
        <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">Mi progreso</Text>

        {/* Progress ring */}
        <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 items-center gap-4">
          <ProgressRing percent={progress.progressPercent} />
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
            {progress.currentBlockName
              ? `Hoy: ${progress.currentBlockName}`
              : 'Rutina activa'}
          </Text>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3">
          <StatCard label="Completados hoy" value={progress.completedToday} color="text-green-600 dark:text-green-400" />
          <StatCard label="Total completados" value={progress.completedTotal} color="text-slate-900 dark:text-slate-50" />
          <StatCard label="Pendientes" value={pending} color="text-amber-600 dark:text-amber-400" />
        </View>

        {/* Last activity */}
        {progress.lastActivityAt && (
          <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
            <Text className="text-xs text-slate-400 dark:text-slate-500">Última actividad</Text>
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">
              {timeAgo(progress.lastActivityAt)}
            </Text>
          </View>
        )}

        {/* Block breakdown */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rutina actual</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            {progress.completedTotal} de {progress.totalExercises} ejercicios completados
          </Text>
          {progress.completions.length === 0 && (
            <Text className="text-sm text-slate-400 dark:text-slate-500">Aún no completaste ningún ejercicio hoy.</Text>
          )}
        </View>

        {/* Historial link */}
        <TouchableOpacity
          onPress={() => router.push('/(main)/(routine)/history')}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex-row items-center gap-2"
          activeOpacity={0.7}
        >
          <Text className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-50">Ver historial de rutinas</Text>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 items-center gap-1">
      <Text className={`text-2xl font-bold ${color}`}>{value}</Text>
      <Text className="text-xs text-slate-400 dark:text-slate-500 text-center">{label}</Text>
    </View>
  )
}

function ProgressSkeleton() {
  return (
    <Screen>
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 gap-5">
        <Skeleton className="h-7 w-40" />
        <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 items-center gap-4">
          <Skeleton className="h-40 w-40 rounded-full" />
        </View>
        <View className="flex-row gap-3">
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 items-center gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-3 w-full" />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  )
}
