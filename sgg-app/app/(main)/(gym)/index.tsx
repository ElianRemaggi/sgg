import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Calendar } from 'lucide-react-native'
import { apiClient, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useGymStore } from '@/store/gymStore'
import { Screen } from '@/components/ui/Screen'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorScreen } from '@/components/ui/ErrorScreen'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ApiResponse, GymPublicDto, MembershipDto } from '@/types/api'

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

export default function GymScreen() {
  const { selectedGymId } = useGymStore()
  const gymId = selectedGymId!

  const {
    data: gymData,
    isLoading: loadingGym,
    error: gymError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.gymInfo(gymId),
    queryFn: () => apiClient<ApiResponse<GymPublicDto>>(`/api/gyms/${gymId}/info`),
    staleTime: 1000 * 60 * 10,
  })

  const { data: membershipsData } = useQuery({
    queryKey: queryKeys.memberships(),
    queryFn: () => apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
    staleTime: 1000 * 60 * 5,
  })

  if (loadingGym) return <GymSkeleton />

  if (gymError) {
    if (gymError instanceof ApiError && gymError.status === 404) {
      return <EmptyState title="Gym no encontrado" subtitle="No se pudo cargar la información del gym." />
    }
    return <ErrorScreen onRetry={refetch} />
  }

  const gym = gymData?.data
  if (!gym) return <EmptyState title="Sin información" subtitle="No se pudo cargar la información del gym." />

  const membership = membershipsData?.data?.find((m) => String(m.gymId) === gymId)
  const expiresAt = membership?.membershipExpiresAt ?? null
  const daysLeft = expiresAt ? daysUntil(expiresAt) : null
  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Sin vencimiento'

  return (
    <Screen>
      <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerClassName="p-4 gap-4">
        {/* Gym header */}
        <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 gap-2">
          <View className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900 items-center justify-center mb-1">
            <Text className="text-2xl font-bold text-green-700 dark:text-green-300">
              {gym.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">{gym.name}</Text>
          {gym.description && (
            <Text className="text-sm text-slate-500 dark:text-slate-400">{gym.description}</Text>
          )}
          <Text className="text-xs text-slate-400 dark:text-slate-500">@{gym.slug}</Text>
        </View>

        {/* Membership card */}
        {membership && (
          <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-3">
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mi membresía</Text>

            <InfoRow label="Rol" value={rolLabel(membership.role)} />
            <InfoRow label="Estado" value={statusLabel(membership.status)} />
            <InfoRow
              label="Vence"
              value={expiresLabel}
              valueClass={daysLeft !== null && daysLeft < 30 ? 'text-red-600 dark:text-red-400' : undefined}
            />
            {daysLeft !== null && daysLeft < 30 && daysLeft > 0 && (
              <View className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">
                <Text className="text-xs text-red-700 dark:text-red-300">
                  Tu membresía vence en {daysLeft} días. Renovála pronto.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Schedule link */}
        <TouchableOpacity
          onPress={() => router.push('/(main)/(gym)/schedule')}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex-row items-center gap-3"
          activeOpacity={0.7}
        >
          <Calendar size={20} color="#16a34a" />
          <Text className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-50">Ver horarios del gym</Text>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  )
}

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-xs text-slate-400 dark:text-slate-500">{label}</Text>
      <Text className={`text-sm font-medium ${valueClass ?? 'text-slate-700 dark:text-slate-300'}`}>{value}</Text>
    </View>
  )
}

function rolLabel(role: string): string {
  const map: Record<string, string> = {
    MEMBER: 'Miembro', COACH: 'Coach', ADMIN: 'Administrador', ADMIN_COACH: 'Admin / Coach',
  }
  return map[role] ?? role
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'Activa', PENDING: 'Pendiente', EXPIRED: 'Expirada', BLOCKED: 'Bloqueada',
  }
  return map[status] ?? status
}

function GymSkeleton() {
  return (
    <Screen>
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 gap-4">
        <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 gap-2">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <Skeleton className="h-6 w-48 mt-1" />
          <Skeleton className="h-4 w-full" />
        </View>
        <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-3">
          <Skeleton className="h-4 w-32" />
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-row justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  )
}
