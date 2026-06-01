'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageResponse, GymRequestDto } from '@/lib/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import { MoreHorizontal } from 'lucide-react'
import { updateGymRequestStatus } from './actions'

const statusColors: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  APPROVED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  PENDING:   'Pendiente',
  CONTACTED: 'Contactado',
  APPROVED:  'Aprobado',
  REJECTED:  'Rechazado',
}

const statusTransitions: Record<string, string[]> = {
  PENDING:   ['CONTACTED', 'REJECTED'],
  CONTACTED: ['APPROVED', 'REJECTED'],
  APPROVED:  ['REJECTED'],
  REJECTED:  ['CONTACTED'],
}

interface Props {
  data: PageResponse<GymRequestDto>
  currentStatus: string
}

export function GymRequestsView({ data, currentStatus }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  function updateFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    params.delete('page')
    router.push(`/platform/gym-requests?${params.toString()}`)
  }

  function handleStatusChange(req: GymRequestDto, newStatus: string) {
    startTransition(async () => {
      const result = await updateGymRequestStatus(req.id, newStatus)
      if (result.success) {
        toast(`Solicitud de ${req.gymName} actualizada a ${statusLabels[newStatus]}`, 'success')
        router.refresh()
      } else {
        toast(result.error ?? 'Error al actualizar', 'error')
      }
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-4">
        <select
          value={currentStatus}
          onChange={(e) => updateFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendientes</option>
          <option value="CONTACTED">Contactados</option>
          <option value="APPROVED">Aprobados</option>
          <option value="REJECTED">Rechazados</option>
        </select>

        <span className="text-sm text-muted-foreground">
          {data.totalElements} solicitud{data.totalElements !== 1 ? 'es' : ''}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Gimnasio</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead className="hidden md:table-cell">Email / Teléfono</TableHead>
            <TableHead className="hidden lg:table-cell">Mensaje</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden sm:table-cell">Fecha</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.content.map((req) => (
            <TableRow key={req.id}>
              <TableCell className="font-medium">{req.gymName}</TableCell>
              <TableCell>{req.contactName}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="text-sm">{req.email}</div>
                <div className="text-xs text-muted-foreground">{req.phone}</div>
              </TableCell>
              <TableCell className="hidden lg:table-cell max-w-xs">
                {req.message ? (
                  <span className="text-sm text-muted-foreground line-clamp-2">{req.message}</span>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Sin mensaje</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[req.status] || ''}>
                  {statusLabels[req.status] ?? req.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                {new Date(req.createdAt).toLocaleDateString('es-AR')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={isPending}
                    className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent disabled:opacity-50"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(statusTransitions[req.status] ?? []).map((next) => (
                      <DropdownMenuItem
                        key={next}
                        onClick={() => handleStatusChange(req, next)}
                      >
                        Marcar como {statusLabels[next]}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard?.writeText(req.email)
                        toast('Email copiado', 'success')
                      }}
                    >
                      Copiar email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {data.content.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No hay solicitudes{currentStatus ? ` con estado "${statusLabels[currentStatus] ?? currentStatus}"` : ''}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.totalElements} solicitudes en total
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
                  router.push(`/platform/gym-requests?${params.toString()}`)
                }}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
