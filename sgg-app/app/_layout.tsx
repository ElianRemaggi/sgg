import '../global.css'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Slot, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useColorScheme } from 'nativewind'
import * as SecureStore from 'expo-secure-store'
import { QueryProvider } from '@/providers/QueryProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { supabase } from '@/lib/supabase'
import { navigateAfterAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { useThemeStore } from '@/store/themeStore'

const BOOTSTRAP_TIMEOUT_MS = 12_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms}ms): ${label}`)), ms)
    ),
  ])
}

/** Aplica el modo de tema persistido (Sistema / Claro / Oscuro) al arrrancar y ante cada cambio. */
function ThemeController() {
  const { mode } = useThemeStore()
  const { setColorScheme } = useColorScheme()

  useEffect(() => {
    setColorScheme(mode)
  }, [mode, setColorScheme])

  return null
}

function BootstrapGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState('Iniciando...')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  useEffect(() => {
    // Hard fallback: if bootstrap never resolves, go to login
    timeoutRef.current = setTimeout(() => {
      console.warn('[Bootstrap] Hard timeout reached, redirecting to login')
      setReady(true)
      router.replace('/(auth)/login')
    }, BOOTSTRAP_TIMEOUT_MS)

    async function bootstrap() {
      try {
        console.log('[Bootstrap] start')
        setStep('Verificando sesión...')
        const nativeJwt = await withTimeout(
          SecureStore.getItemAsync('sgg.jwt'),
          5000,
          'SecureStore.getItemAsync(sgg.jwt)'
        )
        console.log('[Bootstrap] nativeJwt:', nativeJwt ? 'found' : 'none')

        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          'supabase.auth.getSession()'
        )
        console.log('[Bootstrap] supabase session:', session ? 'found' : 'none')

        if (!nativeJwt && !session) {
          router.replace('/(auth)/login')
          return
        }

        setStep('Cargando membresías...')
        await withTimeout(navigateAfterAuth(), 8000, 'navigateAfterAuth()')
      } catch (e: unknown) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          console.warn('[Bootstrap] sesión inválida (401/403), limpiando y redirigiendo al login')
          await SecureStore.deleteItemAsync('sgg.jwt')
          await supabase.auth.signOut()
          router.replace('/(auth)/login')
          return
        }
        const detail = e instanceof Error ? `${e.message}\n\n${e.stack?.slice(0, 600) ?? ''}` : String(e)
        console.error('[Bootstrap] error:', detail)
        setError(__DEV__ ? detail : 'No pudimos iniciar la app. Verificá tu conexión e intentá de nuevo.')
      } finally {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setReady(true)
      }
    }
    bootstrap()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const overlayBg = isDark ? '#0f172a' : '#ffffff'
  const stepTextColor = isDark ? '#94a3b8' : '#6b7280'
  const errorBodyColor = isDark ? '#cbd5e1' : '#374151'

  return (
    <>
      {children}
      {!ready && !error && (
        <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={[styles.stepText, { color: stepTextColor }]}>{step}</Text>
        </View>
      )}
      {error && (
        <View style={[styles.overlay, styles.errorOverlay, { backgroundColor: overlayBg }]}>
          <Text style={styles.errorTitle}>Error al iniciar la app</Text>
          <Text style={[styles.errorBody, { color: errorBodyColor }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => { setError(null); router.replace('/(auth)/login') }}
            style={styles.errorButton}
          >
            <Text style={styles.errorButtonText}>Ir al login</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorOverlay: {
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 13,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
})

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <ToastProvider>
          <ThemeController />
          <StatusBar style="auto" />
          <BootstrapGate>
            <Slot />
          </BootstrapGate>
        </ToastProvider>
      </QueryProvider>
    </SafeAreaProvider>
  )
}
