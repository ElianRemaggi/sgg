import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'

interface GymState {
  selectedGymId: string | null
  setGym: (gymId: string) => void
  clearGym: () => void
}

const secureStorage = {
  getItem: async (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: async (key: string) => SecureStore.deleteItemAsync(key),
}

export const useGymStore = create<GymState>()(
  persist(
    (set) => ({
      selectedGymId: null,
      setGym: (gymId) => set({ selectedGymId: gymId }),
      clearGym: () => set({ selectedGymId: null }),
    }),
    {
      name: 'sgg.gym',
      storage: createJSONStorage(() => secureStorage),
    }
  )
)
