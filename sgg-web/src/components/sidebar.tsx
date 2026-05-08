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

type SectionColor = 'primary' | 'tertiary' | 'cyan'

const sectionConfig: Record<SectionColor, {
  headerClass: string
  activeClass: string
  iconDefault: string
  iconActive: string
}> = {
  primary: {
    headerClass: 'text-primary/55',
    activeClass: 'border-l-2 border-primary bg-primary/10 text-primary font-medium',
    iconDefault: 'text-primary/45',
    iconActive: 'text-primary',
  },
  tertiary: {
    headerClass: 'text-tertiary/55',
    activeClass: 'border-l-2 border-tertiary bg-tertiary/10 text-tertiary font-medium',
    iconDefault: 'text-tertiary/45',
    iconActive: 'text-tertiary',
  },
  cyan: {
    headerClass: 'text-secondary-vivid/55',
    activeClass: 'border-l-2 border-secondary-vivid bg-secondary-vivid/10 text-secondary-vivid font-medium',
    iconDefault: 'text-secondary-vivid/45',
    iconActive: 'text-secondary-vivid',
  },
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

  function renderLinks(
    links: { href: string; label: string; icon: React.ElementType }[],
    color: SectionColor
  ) {
    const cfg = sectionConfig[color]
    return links.map(link => {
      const isActive = pathname === link.href
      return (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all',
            isActive
              ? cfg.activeClass
              : 'text-foreground/70 hover:bg-surface-high hover:text-foreground'
          )}
        >
          <link.icon
            className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? cfg.iconActive : cfg.iconDefault)}
          />
          {link.label}
        </Link>
      )
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    await fetch('/api/auth/native', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="flex h-screen w-64 flex-col bg-sidebar-gradient"
      style={{ borderRight: '1px solid hsl(var(--border) / 0.6)' }}
    >
      <div className="p-4" style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
        <Link
          href="/select-gym"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Cambiar gym
        </Link>
        <h2 className="mt-2 text-lg font-semibold truncate text-gradient-primary">{gymName}</h2>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {isAdmin && (
          <div className="space-y-0.5">
            <p className={cn('mb-2 px-3 text-xs font-semibold uppercase tracking-wider', sectionConfig.primary.headerClass)}>
              Admin
            </p>
            {renderLinks(adminLinks, 'primary')}
          </div>
        )}

        {isCoach && (
          <div className="mt-4 space-y-0.5">
            <p className={cn('mb-2 px-3 text-xs font-semibold uppercase tracking-wider', sectionConfig.tertiary.headerClass)}>
              Coach
            </p>
            {renderLinks(coachLinks, 'tertiary')}
          </div>
        )}

        {isMember && (
          <div className="mt-4 space-y-0.5">
            <p className={cn('mb-2 px-3 text-xs font-semibold uppercase tracking-wider', sectionConfig.cyan.headerClass)}>
              Miembro
            </p>
            {renderLinks(memberLinks, 'cyan')}
          </div>
        )}
      </nav>

      <div className="p-4" style={{ borderTop: '1px solid hsl(var(--border) / 0.5)' }}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
