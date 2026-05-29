import { FlatList, Text, TouchableOpacity, View } from 'react-native'
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
import type { ApiResponse, RoutineHistorySummaryDto } from '@/types/api'

function formatDateRange(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  if (!endsAt) return `Desde ${start}`
  const end = new Date(endsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${start} – ${end}`
}

export default function RoutineHistoryScreen() {
  const { selectedGymId } = useGymStore()
  const gymId = selectedGymId!

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.memberRoutineHistory(gymId),
    queryFn: () =>
      apiClient<ApiResponse<RoutineHistorySummaryDto[]>>(`/api/gyms/${gymId}/member/history/assignments`),
  })

  if (isLoading) return <HistorySkeleton />

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState title="Sin historial" subtitle="Todavía no tenés rutinas anteriores." />
    }
    return <ErrorScreen onRetry={refetch} />
  }

  const history = data?.data ?? []

  if (history.length === 0) {
    return <EmptyState title="Sin historial" subtitle="Todavía no tenés rutinas anteriores." />
  }

  return (
    <Screen>
      <FlatList
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerClassName="p-4 gap-3"
        data={history}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            onPress={() => router.push(`/(main)/(routine)/history/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Historial de rutinas</Text>
        }
      />
    </Screen>
  )
}

function HistoryCard({ item, onPress }: { item: RoutineHistorySummaryDto; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-2"
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-slate-900 dark:text-slate-50 flex-1">{item.templateName}</Text>
            {item.isActive && (
              <View className="bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full shrink-0">
                <Text className="text-xs text-green-700 dark:text-green-300">activa</Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-slate-400 dark:text-slate-500">{formatDateRange(item.startsAt, item.endsAt)}</Text>
        </View>
        <ChevronRight size={18} color="#94a3b8" className="shrink-0 mt-0.5" />
      </View>

      <View className="flex-row gap-4">
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          <Text className="font-medium text-slate-700 dark:text-slate-300">{item.totalCompletions}</Text> completados
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          <Text className="font-medium text-slate-700 dark:text-slate-300">{item.totalSessionDays}</Text> sesiones
        </Text>
        {item.lastActivityAt && (
          <Text className="text-xs text-slate-400 dark:text-slate-500">
            Último: {new Date(item.lastActivityAt).toLocaleDateString('es-AR')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

function HistorySkeleton() {
  return (
    <Screen>
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 gap-3">
        <Skeleton className="h-7 w-48 mb-1" />
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <View className="flex-row gap-4 mt-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </View>
          </View>
        ))}
      </View>
    </Screen>
  )
}
