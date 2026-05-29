import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ScreenProps {
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper que aplica el inset superior real del dispositivo (hora/batería/notificaciones
 * de Android) para que el contenido no quede debajo de la barra de estado.
 * Reemplaza el padding manual `pt-X` en la raíz de cada pantalla.
 */
export function Screen({ children, className = '' }: ScreenProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      className={['flex-1', className].join(' ')}
      style={{ paddingTop: insets.top }}
    >
      {children}
    </View>
  )
}
