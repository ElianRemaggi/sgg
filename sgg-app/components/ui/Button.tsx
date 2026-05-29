import { ActivityIndicator, Pressable, Text } from 'react-native'

type Variant = 'default' | 'secondary' | 'ghost' | 'destructive'
type Size = 'default' | 'sm' | 'lg' | 'icon'

interface ButtonProps {
  onPress?: () => void
  children: React.ReactNode
  variant?: Variant
  size?: Size
  disabled?: boolean
  loading?: boolean
  className?: string
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  default: { container: 'bg-green-600 active:bg-green-700', text: 'text-white font-semibold' },
  secondary: { container: 'bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700', text: 'text-slate-900 dark:text-slate-100 font-semibold' },
  ghost: { container: 'active:bg-slate-100 dark:active:bg-slate-800', text: 'text-slate-700 dark:text-slate-300 font-medium' },
  destructive: { container: 'bg-red-500 active:bg-red-600', text: 'text-white font-semibold' },
}

const sizeStyles: Record<Size, { container: string; text: string }> = {
  default: { container: 'px-4 py-2.5 rounded-lg', text: 'text-sm' },
  sm: { container: 'px-3 py-1.5 rounded-md', text: 'text-xs' },
  lg: { container: 'px-6 py-3.5 rounded-xl', text: 'text-base' },
  icon: { container: 'p-2 rounded-lg', text: 'text-sm' },
}

export function Button({
  onPress,
  children,
  variant = 'default',
  size = 'default',
  disabled,
  loading,
  className = '',
}: ButtonProps) {
  const v = variantStyles[variant]
  const s = sizeStyles[size]
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center',
        v.container,
        s.container,
        isDisabled ? 'opacity-50' : '',
        className,
      ].join(' ')}
    >
      {loading && <ActivityIndicator size="small" color="white" className="mr-2" />}
      {typeof children === 'string' ? (
        <Text className={[v.text, s.text].join(' ')}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}
