'use client'
import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from 'react'
import { Animated, Text, View } from 'react-native'

type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let _id = 0

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: ToastType) => {
    const id = ++_id
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const ctx: ToastContextValue = {
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <View className="absolute bottom-10 left-4 right-4 gap-2 z-50 pointer-events-none">
        {toasts.map((t) => (
          <View
            key={t.id}
            className={[
              'px-4 py-3 rounded-xl shadow-lg',
              t.type === 'success' ? 'bg-green-600' : 'bg-red-600',
            ].join(' ')}
          >
            <Text className="text-white text-sm font-medium">{t.message}</Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
