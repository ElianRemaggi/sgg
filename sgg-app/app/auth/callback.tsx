import { useEffect } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

export default function AuthCallback() {
  useEffect(() => {
    // Fallback: si openAuthSessionAsync no captura el redirect y el usuario
    // queda en esta pantalla, lo mandamos al login después de 2 segundos.
    const t = setTimeout(() => router.replace('/(auth)/login'), 2000)
    return () => clearTimeout(t)
  }, [])

  return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
}
