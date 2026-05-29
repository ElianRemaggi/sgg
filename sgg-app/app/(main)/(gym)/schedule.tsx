import { SectionList, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { apiClient } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useGymStore } from '@/store/gymStore'
import { Screen } from '@/components/ui/Screen'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorScreen } from '@/components/ui/ErrorScreen'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ApiResponse, ScheduleActivityDto } from '@/types/api'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7]

function todayDayNumber(): number {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

function formatTime(time: string): string {
  return time.substring(0, 5)
}

export default function ScheduleScreen() {
  const { selectedGymId } = useGymStore()
  const gymId = selectedGymId!
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.gymSchedule(gymId),
    queryFn: () => apiClient<ApiResponse<ScheduleActivityDto[]>>(`/api/gyms/${gymId}/schedule`),
    staleTime: 1000 * 60 * 30,
  })

  if (isLoading) return <ScheduleSkeleton />
  if (error) return <ErrorScreen onRetry={refetch} />

  const activities = (data?.data ?? []).filter((a) => a.isActive)

  const grouped = DAY_ORDER
    .map((day) => {
      const dayActivities = activities
        .filter((a) => a.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
      return {
        title: dayActivities[0]?.dayName ?? String(day),
        day,
        data: dayActivities,
      }
    })
    .filter((section) => section.data.length > 0)

  const today = todayDayNumber()
  const backIconColor = isDark ? '#f1f5f9' : '#0f172a'

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-3 pb-3 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <ChevronLeft size={22} color={backIconColor} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">Horarios</Text>
      </View>

      {grouped.length === 0 ? (
        <EmptyState title="Sin horarios" subtitle="No hay actividades programadas." />
      ) : (
        <SectionList
          sections={grouped}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="p-4"
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center gap-2 mb-2 mt-4 first:mt-0">
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">{section.title}</Text>
              {section.day === today && (
                <View className="bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-green-700 dark:text-green-300 font-medium">hoy</Text>
                </View>
              )}
            </View>
          )}
          renderItem={({ item, section }) => (
            <View
              className={[
                'bg-white dark:bg-slate-900 rounded-xl border p-4 mb-1.5',
                section.day === today ? 'border-green-200 dark:border-green-800' : 'border-slate-200 dark:border-slate-700',
              ].join(' ')}
            >
              <View className="flex-row items-start justify-between gap-2">
                <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex-1">{item.name}</Text>
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  {formatTime(item.startTime)} – {formatTime(item.endTime)}
                </Text>
              </View>
              {item.description && (
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">{item.description}</Text>
              )}
            </View>
          )}
        />
      )}
    </Screen>
  )
}

function ScheduleSkeleton() {
  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-3 pb-3 flex-row items-center gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-24" />
      </View>
      <View className="p-4 gap-2">
        {[1, 2, 3].map((i) => (
          <View key={i}>
            <Skeleton className="h-4 w-24 mb-2 mt-4" />
            <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-2">
              <View className="flex-row justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-20" />
              </View>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  )
}
