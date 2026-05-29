import { View, Text } from 'react-native'
import { Button } from './Button'

interface ErrorScreenProps {
  message?: string
  onRetry?: () => void
}

export function ErrorScreen({ message = 'Ocurrió un error', onRetry }: ErrorScreenProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-3">
      <Text className="text-4xl">⚠️</Text>
      <Text className="text-base font-semibold text-slate-900 dark:text-slate-50 text-center">Algo salió mal</Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">{message}</Text>
      {onRetry && (
        <Button onPress={onRetry} variant="secondary" size="sm">
          Reintentar
        </Button>
      )}
    </View>
  )
}
