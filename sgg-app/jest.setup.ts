import '@testing-library/jest-native/extend-expect'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  },
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Link: ({ children }: { children: any }) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}))

jest.mock('react-native-reanimated')

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View } = require('react-native')
  const mock = (name: string) =>
    ({ children, ...props }: any) =>
      React.createElement(View, { testID: name, ...props }, children)
  return {
    __esModule: true,
    default: mock('Svg'),
    Svg: mock('Svg'),
    Circle: mock('Circle'),
    Line: mock('Line'),
    Polyline: mock('Polyline'),
    Text: mock('SvgText'),
    Path: mock('Path'),
    Rect: mock('Rect'),
    G: mock('G'),
  }
})

jest.mock('lucide-react-native', () => {
  const React = require('react')
  const { View } = require('react-native')
  const createIcon = (name: string) =>
    (_props: any) =>
      React.createElement(View, { testID: `icon-${name}` })
  return new Proxy({}, { get: (_, name) => (typeof name === 'string' ? createIcon(name) : undefined) })
})

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signInWithOAuth: jest.fn().mockResolvedValue({ data: { url: null }, error: null }),
      setSession: jest.fn().mockResolvedValue({ data: null, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}))

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
}))

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn().mockReturnValue('sgg://auth/callback'),
  useAuthRequest: jest.fn().mockReturnValue([null, null, jest.fn()]),
}))

jest.mock('expo-constants', () => ({
  default: { expoConfig: { name: 'sgg-app' } },
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: any }) => children,
  SafeAreaView: ({ children }: { children: any }) => children,
  useSafeAreaInsets: jest.fn().mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('nativewind', () => ({
  useColorScheme: jest.fn().mockReturnValue({
    colorScheme: 'light',
    setColorScheme: jest.fn(),
    toggleColorScheme: jest.fn(),
  }),
}))
