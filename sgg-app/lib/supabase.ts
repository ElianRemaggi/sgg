import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra ?? {}
const supabaseUrl: string = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey: string = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

const CHUNK_SIZE = 1800

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const chunks = await SecureStore.getItemAsync(`${key}.n`)
    if (chunks) {
      const parts = await Promise.all(
        Array.from({ length: parseInt(chunks, 10) }, (_, i) =>
          SecureStore.getItemAsync(`${key}.${i}`)
        )
      )
      return parts.some((p) => p === null) ? null : parts.join('')
    }
    return SecureStore.getItemAsync(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length > CHUNK_SIZE) {
      const total = Math.ceil(value.length / CHUNK_SIZE)
      await SecureStore.setItemAsync(`${key}.n`, String(total))
      await Promise.all(
        Array.from({ length: total }, (_, i) =>
          SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE))
        )
      )
      await SecureStore.deleteItemAsync(key)
    } else {
      await SecureStore.setItemAsync(key, value)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    const chunks = await SecureStore.getItemAsync(`${key}.n`)
    if (chunks) {
      const n = parseInt(chunks, 10)
      await Promise.all([
        SecureStore.deleteItemAsync(`${key}.n`),
        ...Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)),
      ])
    }
    await SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
