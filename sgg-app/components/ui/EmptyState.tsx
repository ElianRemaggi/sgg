import { View, Text } from 'react-native'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  subtitle?: string
  action?: { label: string; onPress: () => void }
}

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-3">
      <Text className="text-4xl">🏋️</Text>
      <Text className="text-base font-semibold text-slate-900 dark:text-slate-50 text-center">{title}</Text>
      {subtitle && <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">{subtitle}</Text>}
      {action && (
        <Button onPress={action.onPress} variant="secondary" size="sm">
          {action.label}
        </Button>
      )}
    </View>
  )
}
