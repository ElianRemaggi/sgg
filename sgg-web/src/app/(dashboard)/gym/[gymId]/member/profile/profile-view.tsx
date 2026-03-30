'use client'

import { useState, useTransition } from 'react'
import { UserCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserDto, MembershipDto } from '@/lib/api/types'
import { updateProfile } from './actions'

interface ProfileViewProps {
  gymId: string
  user: UserDto
  membership: MembershipDto | null
}

export function ProfileView({ gymId, user, membership }: ProfileViewProps) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState(user.fullName)
  const [editing, setEditing] = useState(false)

  function handleSave() {
    if (!fullName.trim()) {
      toast('El nombre no puede estar vacío', 'error')
      return
    }
    startTransition(async () => {
      const result = await updateProfile(gymId, { fullName: fullName.trim() })
      if (result.success) {
        toast('Perfil actualizado', 'success')
        setEditing(false)
      } else {
        toast(result.error ?? 'Error al guardar', 'error')
      }
    })
  }

  function handleCancel() {
    setFullName(user.fullName)
    setEditing(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    await fetch('/api/auth/native', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="max-w-lg space-y-4">
      {/* Avatar + name */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Información personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <Input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="h-8"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={isPending} className="h-7 text-xs">
                      {isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending} className="h-7 text-xs">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">{user.fullName}</p>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline mt-0.5"
                  >
                    Editar nombre
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <p className="text-sm">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Membership info */}
      {membership && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Membresía</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gym</span>
              <span className="font-medium">{membership.gymName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rol</span>
              <Badge variant="secondary">{membership.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Badge variant={membership.status === 'ACTIVE' ? 'default' : 'outline'}>
                {membership.status}
              </Badge>
            </div>
            {membership.membershipExpiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vence</span>
                <span>{new Date(membership.membershipExpiresAt).toLocaleDateString('es-AR')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full text-muted-foreground"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Cerrar sesión
      </Button>
    </div>
  )
}
