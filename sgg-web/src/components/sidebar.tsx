'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Users, Settings, CalendarDays, Dumbbell, ClipboardList, LogOut, UserCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  gymId: string
  gymName: string
  role: string
}

export function Sidebar({ gymId, gymName, role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isAdmin = role === 'ADMIN' || role === 'ADMIN_COACH'
  const isCoach = role === 'COACH' || role === 'ADMIN_COACH'
  const isMember = role === 'MEMBER'

  const adminLinks = [
    { href: `/gym/${gymId}/admin/members`, label: 'Miembros', icon: Users },
    { href: `/gym/${gymId}/admin/schedule`, label: 'Horarios', icon: CalendarDays },
    { href: `/gym/${gymId}/admin/settings`, label: 'Configuración', icon: Settings },
  ]

  const coachLinks = [
    { href: `/gym/${gymId}/coach/templates`, label: 'Plantillas', icon: Dumbbell },
    { href: `/gym/${gymId}/coach/assign`, label: 'Asignar Rutina', icon: ClipboardList },
  ]

  const memberLinks = [
    { href: `/gym/${gymId}/member/routine`, label: 'Mi Rutina', icon: Dumbbell },
    { href: `/gym/${gymId}/member/schedule`, label: 'Horarios', icon: CalendarDays },
    { href: `/gym/${gymId}/member/profile`, label: 'Perfil', icon: UserCircle },
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
          &larr; Cambiar gym
        </Link>
        <h2 className="mt-2 text-lg font-semibold truncate">{gymName}</h2>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {isAdmin && (
          <div className="space-y-1">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Admin</p>
            {adminLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                  pathname === link.href && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {isCoach && (
          <div className="mt-4 space-y-1">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Coach</p>
            {coachLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                  pathname === link.href && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {isMember && (
          <div className="mt-4 space-y-1">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Miembro</p>
            {memberLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                  pathname === link.href && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
