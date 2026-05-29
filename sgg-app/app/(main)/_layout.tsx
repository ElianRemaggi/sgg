import { Redirect } from 'expo-router'
import { Tabs } from 'expo-router'
import { Dumbbell, BarChart2, Building2, User } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useGymStore } from '@/store/gymStore'

export default function MainLayout() {
  const { selectedGymId } = useGymStore()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  if (!selectedGymId) {
    return <Redirect href="/select-gym" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: isDark ? '#64748b' : '#94a3b8',
        tabBarStyle: {
          borderTopColor: isDark ? '#334155' : '#e2e8f0',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="(routine)"
        options={{
          title: 'Rutina',
          tabBarIcon: ({ color }) => <Dumbbell size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(progress)"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <BarChart2 size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(gym)"
        options={{
          title: 'Mi gym',
          tabBarIcon: ({ color }) => <Building2 size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  )
}
