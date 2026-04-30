'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import type { PageResponse, GymMemberDto } from '@/lib/api/types'
import { MemberActions } from './member-actions'
import { ChangeRoleDialog } from './modals/change-role-dialog'
import { SetExpiryDialog } from './modals/set-expiry-dialog'

interface MembersViewProps {
  initialData: PageResponse<GymMemberDto>
  gymId: string
  currentStatus: string
  currentRole: string
  currentSearch: string
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  BLOCKED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  ADMIN_COACH: 'bg-indigo-100 text-indigo-800',
  COACH: 'bg-blue-100 text-blue-800',
  MEMBER: 'bg-gray-100 text-gray-800',
}

export function MembersView({ initialData, gymId, currentStatus, currentRole, currentSearch }: MembersViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [search, setSearch] = useState(currentSearch)
  const [roleDialogMember, setRoleDialogMember] = useState<GymMemberDto | null>(null)
  const [expiryDialogMember, setExpiryDialogMember] = useState<GymMemberDto | null>(null)

  const pendingCount = initialData.content.filter(m => m.status === 'PENDING').length

  const filteredMembers = useMemo(() => {
    if (!search) return initialData.content
    const q = search.toLowerCase()
    return initialData.content.filter(
      m => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    )
  }, [initialData.content, search])

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'ALL' || !value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`/gym/${gymId}/admin/members?${params.toString()}`)
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/gym/${gymId}/admin/members?${params.toString()}`)
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function isExpiringSoon(dateStr: string | null) {
    if (!dateStr) return false
    const date = new Date(dateStr)
    const daysUntil = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return daysUntil < 30 && daysUntil > 0
  }

  return (
    <div>
      {currentStatus === 'ALL' && pendingCount > 0 && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3">
          <span className="font-medium text-yellow-800">
            {pendingCount} solicitud{pendingCount > 1 ? 'es' : ''} pendiente{pendingCount > 1 ? 's' : ''}
          </span>
          <Button
            variant="link"
            className="ml-2 text-yellow-800 underline"
            onClick={() => updateFilter('status', 'PENDING')}
          >
            Ver pendientes
          </Button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={currentStatus}
          onChange={e => updateFilter('status', e.target.value)}
          className="w-full sm:w-40"
        >
          <option value="ALL">Todos los estados</option>
          <option value="PENDING">Pendientes</option>
          <option value="ACTIVE">Activos</option>
          <option value="BLOCKED">Bloqueados</option>
          <option value="EXPIRED">Expirados</option>
        </Select>

        <Select
          value={currentRole}
          onChange={e => updateFilter('role', e.target.value)}
          className="w-full sm:w-40"
        >
          <option value="ALL">Todos los roles</option>
          <option value="MEMBER">Miembro</option>
          <option value="COACH">Coach</option>
          <option value="ADMIN">Admin</option>
          <option value="ADMIN_COACH">Admin+Coach</option>
        </Select>

        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {filteredMembers.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          No se encontraron miembros con los filtros seleccionados.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Miembro</TableHead>
              <TableHead className="hidden sm:table-cell">Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Vencimiento</TableHead>
              <TableHead className="hidden lg:table-cell">Ingreso</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map(member => (
              <TableRow key={member.memberId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        member.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{member.fullName}</div>
                      <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className={ROLE_COLORS[member.role] ?? ''} variant="secondary">
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[member.status] ?? ''} variant="secondary">
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className={isExpiringSoon(member.membershipExpiresAt) ? 'text-red-600 font-medium' : ''}>
                    {formatDate(member.membershipExpiresAt)}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{formatDate(member.joinedAt)}</TableCell>
                <TableCell>
                  <MemberActions
                    member={member}
                    gymId={gymId}
                    onChangeRole={() => setRoleDialogMember(member)}
                    onSetExpiry={() => setExpiryDialogMember(member)}
                    onToast={toast}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {initialData.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {initialData.totalElements} miembros en total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={initialData.page === 0}
              onClick={() => goToPage(initialData.page - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm">
              Página {initialData.page + 1} de {initialData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={initialData.last}
              onClick={() => goToPage(initialData.page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <ChangeRoleDialog
        member={roleDialogMember}
        gymId={gymId}
        onClose={() => setRoleDialogMember(null)}
        onToast={toast}
      />

      <SetExpiryDialog
        member={expiryDialogMember}
        gymId={gymId}
        onClose={() => setExpiryDialogMember(null)}
        onToast={toast}
      />
    </div>
  )
}
