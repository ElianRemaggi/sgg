import { useState } from 'react'
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useColorScheme } from 'nativewind'
import { apiClient, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useGymStore } from '@/store/gymStore'
import { useToast } from '@/providers/ToastProvider'
import { Screen } from '@/components/ui/Screen'
import { Button } from '@/components/ui/Button'
import type { ApiResponse, GymPublicDto, JoinRequestResponse, MembershipDto } from '@/types/api'

export default function SelectGymScreen() {
  const { setGym } = useGymStore()
  const toast = useToast()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [searchSlug, setSearchSlug] = useState('')
  const [submittedSlug, setSubmittedSlug] = useState('')

  const { data: membershipsData, isLoading } = useQuery({
    queryKey: queryKeys.memberships(),
    queryFn: () => apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
  })

  const memberships = membershipsData?.data?.filter((m) => m.status === 'ACTIVE') ?? []

  const { data: gymData, isFetching: searchingGym } = useQuery({
    queryKey: queryKeys.gymSearch(submittedSlug),
    queryFn: () => apiClient<ApiResponse<GymPublicDto>>(`/api/gyms/search?slug=${submittedSlug}`),
    enabled: submittedSlug.length > 0,
    retry: false,
  })

  const joinMutation = useMutation({
    mutationFn: (gymId: number) =>
      apiClient<ApiResponse<JoinRequestResponse>>(`/api/gyms/${gymId}/join-request`, { method: 'POST' }),
    onSuccess: (res) => {
      toast.success(`Solicitud enviada a ${res.data.gymName}`)
      setSubmittedSlug('')
      setSearchSlug('')
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Error al enviar solicitud')
    },
  })

  const handleSelectGym = (gymId: number) => {
    setGym(String(gymId))
    router.replace('/(main)/(routine)')
  }

  if (isLoading) {
    return (
      <Screen className="bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator />
      </Screen>
    )
  }

  return (
    <Screen className="bg-white dark:bg-slate-950 px-4">
      <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Elegí tu gym</Text>

      {memberships.length > 0 ? (
        <FlatList
          data={memberships}
          keyExtractor={(m) => String(m.membershipId)}
          contentContainerClassName="gap-2 pb-6"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectGym(item.gymId)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex-row items-center gap-3 active:bg-slate-50 dark:active:bg-slate-800"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">{item.gymName}</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500">{item.role} · {item.gymSlug}</Text>
              </View>
              <Text className="text-slate-400 dark:text-slate-500">›</Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <Text className="text-sm text-slate-500 dark:text-slate-400 mb-3">Tus membresías activas</Text>
          }
        />
      ) : (
        <View className="gap-4 mt-4">
          <Text className="text-sm text-slate-500 dark:text-slate-400">No tenés membresías activas. Buscá un gym por su slug.</Text>

          <View className="flex-row gap-2">
            <TextInput
              value={searchSlug}
              onChangeText={setSearchSlug}
              placeholder="ej: crossfit-palermo"
              autoCapitalize="none"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800"
            />
            <Button
              variant="secondary"
              onPress={() => setSubmittedSlug(searchSlug.trim())}
              loading={searchingGym}
              disabled={!searchSlug.trim()}
            >
              Buscar
            </Button>
          </View>

          {gymData?.data && (
            <View className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 gap-3">
              <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">{gymData.data.name}</Text>
              {gymData.data.description && (
                <Text className="text-sm text-slate-500 dark:text-slate-400">{gymData.data.description}</Text>
              )}
              <Button
                onPress={() => joinMutation.mutate(gymData.data!.id)}
                loading={joinMutation.isPending}
              >
                Solicitar acceso
              </Button>
            </View>
          )}

          {submittedSlug && !gymData?.data && !searchingGym && (
            <Text className="text-sm text-slate-400 dark:text-slate-500 text-center">No se encontró ningún gym con ese slug.</Text>
          )}
        </View>
      )}
    </Screen>
  )
}
