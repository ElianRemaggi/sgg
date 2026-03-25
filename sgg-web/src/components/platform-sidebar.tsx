'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Building2, Shield, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function PlatformSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const links = [
    { href: '/platform/gyms', label: 'Gimnasios', icon: Building2 },
    { href: '/platform/admins', label: 'Superadmins', icon: Shield },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    await fetch('/api/auth/native', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b p-4">
        <Link href="/select-gym" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Panel de gym
        </Link>
        <h2 className="mt-2 text-lg font-semibold">Superadmin</h2>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
              pathname.startsWith(link.href) && "bg-accent text-accent-foreground font-medium"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
