module.exports = {
  expo: {
    name: 'sgg-app',
    slug: 'sgg-app',
    owner: 'elianremaggi',
    scheme: 'sgg',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.drinklen.sgg',
      buildNumber: '1',
    },
    android: {
      package: 'com.drinklen.sgg',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      privacyPolicyUrl: 'https://sgg.app/privacy',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-router', 'expo-secure-store', 'expo-web-browser'],
    extra: {
      router: {},
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      eas: {
        projectId: 'f40712d5-f18d-4e0b-b8b5-9020def623d7',
      },
    },
  },
}
