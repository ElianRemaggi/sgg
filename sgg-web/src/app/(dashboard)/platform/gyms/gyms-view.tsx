'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageResponse, GymSummaryDto } from '@/lib/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { suspendGym, reactivateGym, deleteGym } from './actions'
import { DeleteGymDialog } from './delete-gym-dialog'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  DELETED: 'bg-gray-100 text-gray-500',
}

interface Props {
  data: PageResponse<GymSummaryDto>
  currentStatus: string
  currentSearch: string
}

export function GymsView({ data, currentStatus, currentSearch }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(currentSearch)
  const [deleteTarget, setDeleteTarget] = useState<GymSummaryDto | null>(null)

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/platform/gyms?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateFilters('search', searchInput)
  }

  async function handleSuspend(gym: GymSummaryDto) {
    startTransition(async () => {
      const result = await suspendGym(gym.id)
      if (result.success) {
        toast(`${gym.name} suspendido`, 'success')
        router.refresh()
      } else {
        toast(result.error ?? 'Error', 'error')
      }
    })
  }

  async function handleReactivate(gym: GymSummaryDto) {
    startTransition(async () => {
      const result = await reactivateGym(gym.id)
      if (result.success) {
        toast(`${gym.name} reactivado`, 'success')
        router.refresh()
      } else {
        toast(result.error ?? 'Error', 'error')
      }
    })
  }

  async function handleDelete(gym: GymSummaryDto, force: boolean) {
    startTransition(async () => {
      const result = await deleteGym(gym.id, force)
      if (result.success) {
        toast(`${gym.name} eliminado`, 'success')
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast(result.error ?? 'Error', 'error')
      }
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nombre o slug..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <select
          value={currentStatus}
          onChange={(e) => updateFilters('status', e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="SUSPENDED">Suspendidos</option>
          <option value="DELETED">Eliminados</option>
        </select>

        <div className="ml-auto">
          <Link href="/platform/gyms/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear gym
            </Button>
          </Link>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Miembros</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.content.map((gym) => (
            <TableRow key={gym.id}>
              <TableCell className="font-medium">
                <Link href={`/platform/gyms/${gym.id}`} className="hover:underline">
                  {gym.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{gym.slug}</TableCell>
              <TableCell>
                <div className="text-sm">{gym.ownerName}</div>
                <div className="text-xs text-muted-foreground">{gym.ownerEmail}</div>
              </TableCell>
              <TableCell>{gym.membersCount}</TableCell>
              <TableCell>
                <Badge className={statusColors[gym.status] || ''}>{gym.status}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(gym.createdAt).toLocaleDateString('es-AR')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/platform/gyms/${gym.id}`)}>
                      Ver detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/gym/${gym.id}/admin/members`)}>
                      Entrar como admin
                    </DropdownMenuItem>
                    {gym.status === 'ACTIVE' && (
                      <DropdownMenuItem onClick={() => handleSuspend(gym)}>
                        Suspender
                      </DropdownMenuItem>
                    )}
                    {gym.status === 'SUSPENDED' && (
                      <DropdownMenuItem onClick={() => handleReactivate(gym)}>
                        Reactivar
                      </DropdownMenuItem>
                    )}
                    {gym.status !== 'DELETED' && (
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(gym)}
                        className="text-destructive"
                      >
                        Eliminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {data.content.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No se encontraron gimnasios
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.totalElements} gimnasios en total
          </p>
          <div className="flex gap-2">
            {Array.from({ length: data.totalPages }, (_, i) => (
              <Button
                key={i}
                variant={data.page === i ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', String(i))
                  router.push(`/platform/gyms?${params.toString()}`)
                }}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteGymDialog
          gym={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDelete={(force) => handleDelete(deleteTarget, force)}
          isPending={isPending}
        />
      )}
    </>
  )
}
