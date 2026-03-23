'use client'

import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MembershipDto } from '@/lib/api/types'

interface GymSelectorProps {
  memberships: MembershipDto[]
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  ADMIN_COACH: 'Admin + Coach',
  COACH: 'Coach',
  MEMBER: 'Miembro',
}

export function GymSelector({ memberships }: GymSelectorProps) {
  const router = useRouter()

  function handleSelect(membership: MembershipDto) {
    if (membership.status !== 'ACTIVE') return

    const path = ['ADMIN', 'ADMIN_COACH'].includes(membership.role)
      ? `/gym/${membership.gymId}/admin/members`
      : `/gym/${membership.gymId}/coach/templates`

    router.push(path)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {memberships.map(m => (
        <Card
          key={m.membershipId}
          className={`cursor-pointer transition-shadow hover:shadow-md ${
            m.status !== 'ACTIVE' ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          onClick={() => handleSelect(m)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              {m.gymLogoUrl ? (
                <img src={m.gymLogoUrl} alt={m.gymName} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  {m.gymName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{m.gymName}</CardTitle>
                <CardDescription className="text-xs">{m.gymSlug}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{ROLE_LABELS[m.role] ?? m.role}</Badge>
              {m.status === 'PENDING' && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pendiente</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
