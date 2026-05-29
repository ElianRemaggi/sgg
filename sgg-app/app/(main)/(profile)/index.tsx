import { useState } from 'react'
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Edit2, Sun, Moon, Smartphone } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { apiClient, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { logout } from '@/lib/auth'
import { useGymStore } from '@/store/gymStore'
import { useToast } from '@/providers/ToastProvider'
import { Screen } from '@/components/ui/Screen'
import { Button } from '@/components/ui/Button'
import { useThemeStore, type ThemeMode } from '@/store/themeStore'
import type { ApiResponse, GymPublicDto, JoinRequestResponse, MembershipDto, UserDto } from '@/types/api'

export default function ProfileScreen() {
  const { selectedGymId, clearGym } = useGymStore()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { colorScheme, setColorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore()

  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editName, setEditName] = useState('')
  const [searchSlug, setSearchSlug] = useState('')
  const [submittedSlug, setSubmittedSlug] = useState('')
  const [joinConfirmGym, setJoinConfirmGym] = useState<GymPublicDto | null>(null)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const placeholderColor = isDark ? '#64748b' : '#94a3b8'
  const inputClass = 'border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800'
  const modalBg = isDark ? '#1e293b' : '#ffffff'
  const modalTextPrimary = isDark ? '#f8fafc' : '#0f172a'
  const modalTextSecondary = isDark ? '#94a3b8' : '#475569'

  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: () => apiClient<ApiResponse<UserDto>>('/api/users/me'),
    retry: false,
  })

  const { data: membershipsData } = useQuery({
    queryKey: queryKeys.memberships(),
    queryFn: () => apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
  })

  const { data: gymSearchData, isFetching: searchingGym, error: searchError } = useQuery({
    queryKey: queryKeys.gymSearch(submittedSlug),
    queryFn: () => apiClient<ApiResponse<GymPublicDto>>(`/api/gyms/search?slug=${submittedSlug}`),
    enabled: submittedSlug.length > 0,
    retry: false,
  })

  const updateNameMutation = useMutation({
    mutationFn: (fullName: string) =>
      apiClient<ApiResponse<UserDto>>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({ fullName }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() })
      setEditModalVisible(false)
      toast.success('Nombre actualizado')
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Error al actualizar')
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: () => apiClient<ApiResponse<null>>('/api/users/me', { method: 'DELETE' }),
    onSuccess: async () => {
      await logout()
      clearGym()
      queryClient.clear()
      router.replace('/(auth)/login')
    },
    onError: (err) => {
      closeDeleteModal()
      toast.error(err instanceof ApiError ? err.message : 'Error al eliminar la cuenta')
    },
  })

  const joinMutation = useMutation({
    mutationFn: (gymId: number) =>
      apiClient<ApiResponse<JoinRequestResponse>>(`/api/gyms/${gymId}/join-request`, { method: 'POST' }),
    onSuccess: (res) => {
      toast.success(`Solicitud enviada a ${res.data.gymName}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.memberships() })
      setJoinConfirmGym(null)
      setSubmittedSlug('')
      setSearchSlug('')
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Ya tenés una solicitud pendiente en este gym')
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Error al enviar solicitud')
      }
      setJoinConfirmGym(null)
    },
  })

  const handleLogout = async () => {
    await logout()
    clearGym()
    queryClient.clear()
    router.replace('/(auth)/login')
  }

  const handleSearch = () => {
    const slug = searchSlug.trim()
    if (slug) setSubmittedSlug(slug)
  }

  const closeDeleteModal = () => {
    setDeleteConfirmVisible(false)
    setDeleteConfirmText('')
  }

  const handleSetTheme = (m: ThemeMode) => {
    setThemeMode(m)
    setColorScheme(m)
  }

  const user = userData?.data
  const memberships = membershipsData?.data ?? []
  const activeMemberships = memberships.filter((m) => m.status === 'ACTIVE')
  const activeGym = activeMemberships.find((m) => String(m.gymId) === selectedGymId)
  const showChangeGym = activeMemberships.length > 1

  const foundGym = gymSearchData?.data
  const gymNotFound = submittedSlug.length > 0 && !foundGym && !searchingGym && (searchError || gymSearchData)

  const canDelete = deleteConfirmText.trim().toUpperCase() === 'ELIMINAR'

  return (
    <Screen>
      <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerClassName="p-4 gap-5">

        {/* Header */}
        <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 gap-3">
          {loadingUser ? (
            <ActivityIndicator />
          ) : (
            <View className="flex-row items-center gap-4">
              <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center">
                <Text className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">{user?.fullName ?? '—'}</Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">{user?.email ?? '—'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEditName(user?.fullName ?? '')
                  setEditModalVisible(true)
                }}
                className="p-2"
              >
                <Edit2 size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Delete account — discreto, entre perfil y gyms */}
        <TouchableOpacity
          onPress={() => setDeleteConfirmVisible(true)}
          className="self-end px-1"
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}
        >
          <Text className="text-xs text-red-400 dark:text-red-500">Eliminar cuenta</Text>
        </TouchableOpacity>

        {/* Active gym */}
        {activeGym && (
          <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-3">
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mi gym activo</Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-base font-medium text-slate-900 dark:text-slate-50">{activeGym.gymName}</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500">{activeGym.role} · @{activeGym.gymSlug}</Text>
              </View>
            </View>
            {showChangeGym && (
              <TouchableOpacity
                onPress={() => router.push('/select-gym')}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
              >
                <Text className="text-sm text-green-600 dark:text-green-400 font-medium">Cambiar gym</Text>
                <ChevronRight size={14} color={isDark ? '#4ade80' : '#16a34a'} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Apariencia */}
        <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-3">
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">Apariencia</Text>
          <View className="flex-row rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {([
              { value: 'system' as ThemeMode, label: 'Sistema', Icon: Smartphone },
              { value: 'light' as ThemeMode, label: 'Claro', Icon: Sun },
              { value: 'dark' as ThemeMode, label: 'Oscuro', Icon: Moon },
            ]).map(({ value, label, Icon }, idx, arr) => {
              const isSelected = themeMode === value
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleSetTheme(value)}
                  className={[
                    'flex-1 py-2.5 items-center justify-center gap-1',
                    isSelected ? 'bg-green-600' : 'bg-transparent',
                    idx < arr.length - 1 ? 'border-r border-slate-200 dark:border-slate-700' : '',
                  ].join(' ')}
                  activeOpacity={0.7}
                >
                  <Icon size={14} color={isSelected ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'} />
                  <Text className={['text-xs font-medium', isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-400'].join(' ')}>
                    {label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Join a gym */}
        <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 gap-3">
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">Unirse a un gym</Text>
          <View className="flex-row gap-2">
            <TextInput
              value={searchSlug}
              onChangeText={setSearchSlug}
              placeholder="Slug del gym (ej: crossfit-palermo)"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={placeholderColor}
              className={`flex-1 ${inputClass}`}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <Button variant="secondary" onPress={handleSearch} loading={searchingGym} disabled={!searchSlug.trim()}>
              Buscar
            </Button>
          </View>

          {foundGym && (
            <View className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 gap-2">
              <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{foundGym.name}</Text>
              {foundGym.description && (
                <Text className="text-xs text-slate-500 dark:text-slate-400">{foundGym.description}</Text>
              )}
              <Button onPress={() => setJoinConfirmGym(foundGym)} loading={joinMutation.isPending}>
                Solicitar acceso
              </Button>
            </View>
          )}

          {gymNotFound && (
            <Text className="text-sm text-slate-400 dark:text-slate-500 text-center">No se encontró ningún gym con ese slug.</Text>
          )}
        </View>

        {/* Logout */}
        <Button variant="destructive" onPress={handleLogout}>
          Cerrar sesión
        </Button>

        {/* Edit name modal */}
        <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
            <View style={{ backgroundColor: modalBg }} className="rounded-2xl p-6 w-full gap-4">
              <Text style={{ color: modalTextPrimary }} className="text-lg font-bold">Editar nombre</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Nombre completo"
                placeholderTextColor={placeholderColor}
                style={{ color: modalTextPrimary, backgroundColor: isDark ? '#334155' : '#f8fafc', borderColor: isDark ? '#475569' : '#e2e8f0' }}
                className="border rounded-lg px-3 py-2.5 text-sm"
                autoFocus
              />
              <View className="flex-row gap-2">
                <Button variant="secondary" onPress={() => setEditModalVisible(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onPress={() => updateNameMutation.mutate(editName.trim())}
                  loading={updateNameMutation.isPending}
                  disabled={!editName.trim()}
                  className="flex-1"
                >
                  Guardar
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete account modal — doble confirmación tipeando ELIMINAR */}
        <Modal visible={deleteConfirmVisible} transparent animationType="fade" onRequestClose={closeDeleteModal}>
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
            <View style={{ backgroundColor: modalBg }} className="rounded-2xl p-6 w-full gap-4">
              <Text style={{ color: modalTextPrimary }} className="text-lg font-bold">¿Eliminar tu cuenta?</Text>
              <Text style={{ color: modalTextSecondary }} className="text-sm">
                Esta acción es permanente. Tu cuenta, accesos a gyms y tu historial dejarán de estar disponibles.{'\n\n'}
                Esta acción no se puede deshacer.
              </Text>
              <View className="gap-1.5">
                <Text style={{ color: modalTextSecondary }} className="text-xs font-medium">
                  Escribí ELIMINAR para confirmar:
                </Text>
                <TextInput
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder="ELIMINAR"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
                  style={{ color: modalTextPrimary, backgroundColor: isDark ? '#334155' : '#f8fafc', borderColor: isDark ? '#475569' : '#e2e8f0' }}
                  className="border rounded-lg px-3 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-2">
                <Button variant="secondary" onPress={closeDeleteModal} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onPress={() => deleteAccountMutation.mutate()}
                  loading={deleteAccountMutation.isPending}
                  disabled={!canDelete}
                  className="flex-1"
                >
                  Eliminar
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Join confirm modal */}
        <Modal visible={!!joinConfirmGym} transparent animationType="fade" onRequestClose={() => setJoinConfirmGym(null)}>
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
            <View style={{ backgroundColor: modalBg }} className="rounded-2xl p-6 w-full gap-4">
              <Text style={{ color: modalTextPrimary }} className="text-lg font-bold">Confirmar solicitud</Text>
              <Text style={{ color: modalTextSecondary }} className="text-sm">
                ¿Querés unirte a <Text style={{ color: modalTextPrimary }} className="font-semibold">{joinConfirmGym?.name}</Text>?{'\n'}
                El admin del gym te dará acceso pronto.
              </Text>
              <View className="flex-row gap-2">
                <Button variant="secondary" onPress={() => setJoinConfirmGym(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onPress={() => joinConfirmGym && joinMutation.mutate(joinConfirmGym.id)}
                  loading={joinMutation.isPending}
                  className="flex-1"
                >
                  Confirmar
                </Button>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </Screen>
  )
}
