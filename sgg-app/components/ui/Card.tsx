import { View, Text } from 'react-native'

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={['bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden', className].join(' ')}>
      {children}
    </View>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={['px-4 pt-4 pb-2', className].join(' ')}>
      {children}
    </View>
  )
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={['px-4 pb-4', className].join(' ')}>
      {children}
    </View>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={['text-base font-semibold text-slate-900 dark:text-slate-50', className].join(' ')}>
      {children}
    </Text>
  )
}
