'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { RoutineTemplateSummaryDto } from '@/lib/api/types'
import { deleteTemplate } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

interface TemplatesViewProps {
  templates: RoutineTemplateSummaryDto[]
  gymId: string
}

export function TemplatesView({ templates, gymId }: TemplatesViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<RoutineTemplateSummaryDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteTemplate(gymId, deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)

    if (!result.success) {
      toast(
        result.status === 409
          ? 'Esta plantilla tiene rutinas activas asignadas. Finalizalas antes de eliminar.'
          : result.error ?? 'Error al eliminar la plantilla',
        'error'
      )
    } else {
      toast('Plantilla eliminada', 'success')
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {templates.length} plantilla{templates.length !== 1 ? 's' : ''}
        </p>
        <Link href={`/gym/${gymId}/coach/templates/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Plantilla
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No hay plantillas creadas todavía</p>
            <Link href={`/gym/${gymId}/coach/templates/new`} className="mt-4">
              <Button variant="outline">Crear tu primera plantilla</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex gap-1">
                    <Link href={`/gym/${gymId}/coach/templates/${template.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {template.blocksCount} bloque{template.blocksCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Por {template.createdBy?.fullName ?? 'Desconocido'}</span>
                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar plantilla</DialogTitle>
            {deleteTarget && (
              <p className="text-sm text-muted-foreground">
                ¿Eliminar la plantilla &quot;{deleteTarget.name}&quot;?
                Esta acción no se puede deshacer.
              </p>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
