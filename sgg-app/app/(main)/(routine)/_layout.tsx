import { Stack } from 'expo-router'

export default function RoutineLayout() {
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
          headerTintColor: '#0f172a',
          headerStyle: { backgroundColor: '#ffffff' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="history/[assignmentId]/exercise/[exerciseId]"
        options={{
          headerShown: true,
          title: 'Progresión',
          headerBackTitle: 'Rutina',
          headerTintColor: '#0f172a',
          headerStyle: { backgroundColor: '#ffffff' },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  )
}
