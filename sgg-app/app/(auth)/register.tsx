import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Screen } from '@/components/ui/Screen'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { nativeRegister } from '@/lib/auth'
import { useToast } from '@/providers/ToastProvider'
import { ApiError } from '@/lib/api'

const schema = z.object({
  fullName: z.string().min(2, 'Nombre demasiado corto'),
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Mínimo 3 caracteres').regex(/^[a-z0-9_]+$/, 'Solo letras, números y _'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})
type RegisterForm = z.infer<typeof schema>

export default function RegisterScreen() {
  const toast = useToast()
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      await nativeRegister({
        fullName: data.fullName,
        email: data.email,
        username: data.username,
        password: data.password,
      })
      router.replace('/')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al registrarse')
    }
  }

  return (
    <Screen className="bg-white dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="px-6 py-12" keyboardShouldPersistTaps="handled">
          <View className="gap-8">
            <View className="gap-1">
              <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">Crear cuenta</Text>
              <Text className="text-slate-500 dark:text-slate-400">Completá tus datos para empezar</Text>
            </View>

            <View className="gap-4">
              <Controller control={control} name="fullName" render={({ field }) => (
                <Input label="Nombre completo" placeholder="Juan García" value={field.value} onChangeText={field.onChange} error={errors.fullName?.message} />
              )} />
              <Controller control={control} name="email" render={({ field }) => (
                <Input label="Email" placeholder="juan@ejemplo.com" keyboardType="email-address" autoCapitalize="none" value={field.value} onChangeText={field.onChange} error={errors.email?.message} />
              )} />
              <Controller control={control} name="username" render={({ field }) => (
                <Input label="Usuario" placeholder="juangarcia" autoCapitalize="none" value={field.value} onChangeText={field.onChange} error={errors.username?.message} />
              )} />
              <Controller control={control} name="password" render={({ field }) => (
                <Input label="Contraseña" placeholder="Mínimo 8 caracteres" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.password?.message} />
              )} />
              <Controller control={control} name="confirmPassword" render={({ field }) => (
                <Input label="Confirmar contraseña" placeholder="Repetí la contraseña" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.confirmPassword?.message} />
              )} />
              <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg">
                Crear cuenta
              </Button>
            </View>

            <TouchableOpacity onPress={() => router.back()} className="items-center">
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                ¿Ya tenés cuenta?{' '}
                <Text className="text-green-600 dark:text-green-400 font-semibold">Iniciá sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
