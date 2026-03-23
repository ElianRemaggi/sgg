'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SuperAdminDto, UserSearchDto, ApiResponse } from '@/lib/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { promoteUser, demoteUser } from './actions'

interface Props {
  admins: SuperAdminDto[]
  currentUserId: number
}

export function AdminsView({ admins, currentUserId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchDto[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchDto | null>(null)

  const doSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/platform/users?search=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      )
      if (res.ok) {
        const data: ApiResponse<UserSearchDto[]> = await res.json()
        // Exclude existing superadmins from results
        const adminIds = new Set(admins.map(a => a.id))
        setSearchResults(data.data.filter(u => !adminIds.has(u.id)))
      }
    } catch {
      // ignore
    }
  }, [admins])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search, doSearch])

  async function handlePromote() {
    if (!selectedUser) return
    startTransition(async () => {
      const result = await promoteUser(selectedUser.id)
      if (result.success) {
        toast(`${selectedUser.fullName} promovido a Superadmin`, 'success')
        setSelectedUser(null)
        setSearch('')
        router.refresh()
      } else {
        toast(result.error ?? 'Error', 'error')
      }
    })
  }

  async function handleDemote(admin: SuperAdminDto) {
    startTransition(async () => {
      const result = await demoteUser(admin.id)
      if (result.success) {
        toast(`${admin.fullName} ya no es Superadmin`, 'success')
        router.refresh()
      } else {
        toast(result.error ?? 'Error', 'error')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-md bg-muted/50 p-4 text-sm">
        Sos uno de <strong>{admins.length}</strong> superadmin{admins.length !== 1 ? 's' : ''}.
      </div>

      {/* Promote section */}
      <Card>
        <CardHeader>
          <CardTitle>Promover usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedUser ? (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{selectedUser.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handlePromote} disabled={isPending}>
                  {isPending ? 'Promoviendo...' : 'Promover a Superadmin'}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario por nombre o email..."
              />
              {searchResults.length > 0 && (
                <ul className="mt-1 rounded-md border bg-background">
                  {searchResults.map((user) => (
                    <li
                      key={user.id}
                      className="cursor-pointer px-3 py-2 hover:bg-accent"
                      onClick={() => {
                        setSelectedUser(user)
                        setSearchResults([])
                        setSearch('')
                      }}
                    >
                      <span className="font-medium">{user.fullName}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{user.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin list */}
      <Card>
        <CardHeader>
          <CardTitle>Superadmins activos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {admins.map((admin) => (
              <li key={admin.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{admin.fullName}</p>
                    {admin.id === currentUserId && (
                      <Badge variant="outline" className="text-xs">Vos</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={admin.id === currentUserId || isPending}
                  onClick={() => handleDemote(admin)}
                  title={admin.id === currentUserId ? 'No podes quitarte el acceso' : undefined}
                >
                  Quitar acceso
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
