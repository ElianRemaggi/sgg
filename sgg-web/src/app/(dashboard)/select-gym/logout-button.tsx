'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    await fetch('/api/auth/native', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground rounded-lg border border-border hover:bg-accent hover:text-foreground transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </button>
  )
}
