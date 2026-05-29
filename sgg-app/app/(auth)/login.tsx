import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { Screen } from '@/components/ui/Screen'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { nativeLogin, syncSupabaseUser, navigateAfterAuth, logout } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/providers/ToastProvider'
import { ApiError } from '@/lib/api'

WebBrowser.maybeCompleteAuthSession()

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Campo requerido'),
  password: z.string().min(1, 'Campo requerido'),
})
type LoginForm = z.infer<typeof loginSchema>

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''

export default function LoginScreen() {
  const toast = useToast()
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log('[Login] nativeLogin start')
      await nativeLogin(data.usernameOrEmail, data.password)
      console.log('[Login] nativeLogin ok, navigating')
      await navigateAfterAuth()
      console.log('[Login] navigation done')
    } catch (err) {
      console.error('[Login] error:', err)
      toast.error(err instanceof ApiError ? err.message : 'Error al iniciar sesión')
    }
  }

  const handleGoogle = async () => {
    setLoadingGoogle(true)
    try {
      const redirectUrl = makeRedirectUri({ scheme: 'sgg', path: 'auth/callback' })
      console.log('[Google OAuth] redirectUrl:', redirectUrl)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      })
      if (error || !data.url) throw error ?? new Error('No auth URL')
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
      console.log('[Google OAuth] result.type:', result.type)
      if (result.type === 'success') {
        const url = result.url
        console.log('[Google OAuth] callback url:', url)

        // PKCE flow: code in query params
        const queryParams = new URLSearchParams(url.split('?')[1] ?? '')
        const code = queryParams.get('code')

        // Implicit flow: tokens in hash fragment
        const hashParams = new URLSearchParams(url.split('#')[1] ?? '')
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')

        try {
          if (code) {
            console.log('[Google OAuth] PKCE: exchangeCodeForSession')
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            if (exchangeError) throw exchangeError
          } else if (access_token && refresh_token) {
            console.log('[Google OAuth] implicit: setSession')
            const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token })
            console.log('[Google OAuth] setSession result:', sessionError ? sessionError.message : 'ok')
            if (sessionError) throw sessionError
          } else {
            throw new Error(`No tokens in callback URL: ${url}`)
          }
          console.log('[Google OAuth] syncSupabaseUser...')
          await syncSupabaseUser()
          console.log('[Google OAuth] sync ok, navigating...')
          await navigateAfterAuth()
        } catch (syncErr) {
          console.error('[Google OAuth] error in auth flow:', syncErr)
          await logout()
          toast.error(syncErr instanceof ApiError ? syncErr.message : 'Error al sincronizar usuario con Google')
        }
      }
    } catch (err) {
      toast.error('Error al iniciar sesión con Google')
    } finally {
      setLoadingGoogle(false)
    }
  }

  return (
    <Screen className="bg-white dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-1 justify-center px-6 py-12" keyboardShouldPersistTaps="handled">
          <View className="gap-8">
            <View className="gap-1">
              <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">Bienvenido</Text>
              <Text className="text-slate-500 dark:text-slate-400">Iniciá sesión para continuar</Text>
            </View>

            <View className="gap-4">
              <Controller
                control={control}
                name="usernameOrEmail"
                render={({ field }) => (
                  <Input
                    label="Usuario o email"
                    placeholder="usuario@ejemplo.com"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.usernameOrEmail?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <Input
                    label="Contraseña"
                    placeholder="••••••••"
                    secureTextEntry
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.password?.message}
                  />
                )}
              />
              <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg">
                Iniciar sesión
              </Button>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <Text className="text-xs text-slate-400 dark:text-slate-500">o</Text>
              <View className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </View>

            <Button variant="secondary" size="lg" onPress={handleGoogle} loading={loadingGoogle}>
              Continuar con Google
            </Button>

            <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="items-center">
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                ¿No tenés cuenta?{' '}
                <Text className="text-green-600 dark:text-green-400 font-semibold">Registrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
