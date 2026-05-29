import { TextInput, View, Text, type TextInputProps } from 'react-native'
import { useColorScheme } from 'nativewind'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps & { className?: string }) {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Text>}
      <TextInput
        className={[
          'border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800',
          error ? 'border-red-400 dark:border-red-500' : '',
          className,
        ].join(' ')}
        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
        {...props}
      />
      {error && <Text className="text-xs text-red-500 dark:text-red-400">{error}</Text>}
    </View>
  )
}
