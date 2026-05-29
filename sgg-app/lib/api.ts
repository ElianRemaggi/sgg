import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'
import { supabase } from './supabase'

const extra = Constants.expoConfig?.extra ?? {}
const API_BASE: string = extra.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080'

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: { message?: string; errors?: string[] }
  ) {
    super(body.message ?? `HTTP ${status}`)
  }
}

async function getToken(): Promise<string | null> {
  const native = await SecureStore.getItemAsync('sgg.jwt')
  if (native) return native
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let body: { message?: string; errors?: string[] } = {}
    try {
      body = await res.json()
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, body)
  }

  if (res.status === 204) return undefined as unknown as T
  return res.json()
}
