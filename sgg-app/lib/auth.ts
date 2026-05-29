import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { apiClient, ApiError } from './api'
import { supabase } from './supabase'
import { useGymStore } from '@/store/gymStore'
import type { ApiResponse, MembershipDto } from '@/types/api'

interface NativeLoginResponse {
  token: string
  user: { id: number; fullName: string; email: string }
}

interface NativeRegisterRequest {
  fullName: string
  email: string
  username: string
  password: string
}

export async function nativeLogin(usernameOrEmail: string, password: string) {
  const res = await apiClient<ApiResponse<NativeLoginResponse>>(
    '/api/public/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ identifier: usernameOrEmail, password }),
    }
  )
  await SecureStore.setItemAsync('sgg.jwt', res.data.token)
  return res.data
}

export async function nativeRegister(payload: NativeRegisterRequest) {
  await apiClient('/api/public/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return nativeLogin(payload.email, payload.password)
}

export async function syncSupabaseUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session for sync')

  const user = session.user
  const identity = user.identities?.[0]

  await apiClient('/api/auth/sync', {
    method: 'POST',
    body: JSON.stringify({
      supabaseUid: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name
        ?? user.user_metadata?.name
        ?? user.email?.split('@')[0]
        ?? 'Usuario',
      avatarUrl: user.user_metadata?.avatar_url ?? null,
      provider: identity?.provider ?? 'google',
      providerUid: identity?.id ?? user.id,
    }),
  })
}

export async function logout() {
  await SecureStore.deleteItemAsync('sgg.jwt')
  await supabase.auth.signOut()
}

export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403)
}

export async function navigateAfterAuth(): Promise<void> {
  console.log('[navigateAfterAuth] fetching memberships')
  const res = await apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships')
  const active = (res.data ?? []).filter((m) => m.status === 'ACTIVE')
  console.log('[navigateAfterAuth] active memberships:', active.length, active.map(m => m.gymId))

  if (active.length === 0) {
    console.log('[navigateAfterAuth] no memberships → select-gym')
    router.replace('/select-gym')
    return
  }

  const { selectedGymId, setGym } = useGymStore.getState()
  console.log('[navigateAfterAuth] selectedGymId:', selectedGymId)

  if (!selectedGymId || !active.find((m) => String(m.gymId) === selectedGymId)) {
    if (active.length === 1) {
      console.log('[navigateAfterAuth] setting gym', active[0].gymId, '→ main/routine')
      setGym(String(active[0].gymId))
      router.replace('/(main)/(routine)')
    } else {
      console.log('[navigateAfterAuth] multiple gyms → select-gym')
      router.replace('/select-gym')
    }
    return
  }

  console.log('[navigateAfterAuth] gym already selected → main/routine')
  router.replace('/(main)/(routine)')
}
