'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RoutineTemplateSummaryDto } from '@/lib/api/types'
import { deleteTemplate, startPersonalRoutine, finishActiveRoutineAction } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Plus, Pencil, Trash2, FileSpreadsheet, Play } from 'lucide-react'
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
  isPersonalGym?: boolean
}

export function TemplatesView({ templates, gymId, isPersonalGym = false }: TemplatesViewProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<RoutineTemplateSummaryDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [startingId, setStartingId] = useState<number | null>(null)
  const [conflictTemplate, setConflictTemplate] = useState<RoutineTemplateSummaryDto | null>(null)
  const [finishing, setFinishing] = useState(false)
  const { toast } = useToast()

  async function handleStart(template: RoutineTemplateSummaryDto) {
    setStartingId(template.id)
    const result = await startPersonalRoutine(gymId, template.id)
    setStartingId(null)
    if (result.success) {
      router.push(`/gym/${gymId}/member/routine`)
      return
    }
    if (result.status === 409) {
      setConflictTemplate(template)
      return
    }
    toast(result.error ?? 'Error al iniciar la rutina', 'error')
  }

  async function handleFinishAndStart() {
    if (!conflictTemplate) return
    setFinishing(true)
    const finish = await finishActiveRoutineAction(gymId)
    if (!finish.success) {
      setFinishing(false)
      toast(finish.error ?? 'Error al finalizar la rutina actual', 'error')
      return
    }
    const start = await startPersonalRoutine(gymId, conflictTemplate.id)
    setFinishing(false)
    setConflictTemplate(null)
    if (start.success) {
      router.push(`/gym/${gymId}/member/routine`)
    } else {
      toast(start.error ?? 'Error al iniciar la rutina', 'error')
    }
  }

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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Exportar a Excel"
                      onClick={() => { window.location.href = `/api/gyms/${gymId}/templates/${template.id}/export?format=xlsx` }}
                    >
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    </Button>
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
                {isPersonalGym && (
                  <Button
                    className="mt-4 w-full"
                    onClick={() => handleStart(template)}
                    disabled={startingId === template.id}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {startingId === template.id ? 'Iniciando...' : 'Empezar esta rutina'}
                  </Button>
                )}
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

      <Dialog open={!!conflictTemplate} onOpenChange={() => setConflictTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ya tenés una rutina activa</DialogTitle>
            {conflictTemplate && (
              <p className="text-sm text-muted-foreground">
                Para empezar &quot;{conflictTemplate.name}&quot; necesitás finalizar tu rutina actual.
                ¿Querés finalizarla y empezar esta?
              </p>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictTemplate(null)} disabled={finishing}>
              Cancelar
            </Button>
            <Button onClick={handleFinishAndStart} disabled={finishing}>
              {finishing ? 'Cambiando...' : 'Finalizar y empezar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
