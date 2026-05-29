import { View, Text } from 'react-native'

type Variant = 'default' | 'secondary' | 'outline' | 'success'

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

const styles: Record<Variant, { container: string; text: string }> = {
  default: { container: 'bg-slate-900 dark:bg-slate-100', text: 'text-white dark:text-slate-900' },
  secondary: { container: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-200' },
  outline: { container: 'border border-slate-300 dark:border-slate-600 bg-transparent', text: 'text-slate-700 dark:text-slate-300' },
  success: { container: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-300' },
}

export function Badge({ children, variant = 'secondary', className = '' }: BadgeProps) {
  const s = styles[variant]
  return (
    <View className={['px-2 py-0.5 rounded-full inline-flex', s.container, className].join(' ')}>
      <Text className={['text-xs font-medium', s.text].join(' ')}>{children}</Text>
    </View>
  )
}
