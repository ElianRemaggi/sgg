import { Stack } from 'expo-router'
import { useColorScheme } from 'nativewind'

export default function RoutineLayout() {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const headerBg = isDark ? '#0f172a' : '#ffffff'
  const headerTint = isDark ? '#f8fafc' : '#0f172a'

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
      <Stack.Screen
        name="history/[assignmentId]/index"
        options={{
          headerShown: true,
          title: 'Detalle de rutina',
          headerBackTitle: 'Historial',
          headerTintColor: headerTint,
          headerStyle: { backgroundColor: headerBg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="history/[assignmentId]/exercise/[exerciseId]"
        options={{
          headerShown: true,
          title: 'Progresión',
          headerBackTitle: 'Rutina',
          headerTintColor: headerTint,
          headerStyle: { backgroundColor: headerBg },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  )
}
