'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { createTemplate, updateTemplate } from './actions'
import { useToast } from '@/components/ui/toast'
import type { RoutineTemplateDetailDto } from '@/lib/api/types'

interface BlockForm {
  clientId: string
  name: string
  dayNumber: number
  exercises: ExerciseForm[]
}

interface ExerciseForm {
  clientId: string
  name: string
  sets: string
  reps: string
  restSeconds: string
  notes: string
}

interface TemplateEditorProps {
  gymId: string
  template?: RoutineTemplateDetailDto
}

function newExercise(): ExerciseForm {
  return {
    clientId: crypto.randomUUID(),
    name: '',
    sets: '',
    reps: '',
    restSeconds: '',
    notes: '',
  }
}

function newBlock(dayNumber: number): BlockForm {
  return {
    clientId: crypto.randomUUID(),
    name: `Día ${dayNumber}`,
    dayNumber,
    exercises: [newExercise()],
  }
}

export function TemplateEditor({ gymId, template }: TemplateEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isEdit = !!template

  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [blocks, setBlocks] = useState<BlockForm[]>(() => {
    if (template?.blocks?.length) {
      return template.blocks.map(b => ({
        clientId: crypto.randomUUID(),
        name: b.name,
        dayNumber: b.dayNumber,
        exercises: b.exercises.map(e => ({
          clientId: crypto.randomUUID(),
          name: e.name,
          sets: e.sets?.toString() ?? '',
          reps: e.reps ?? '',
          restSeconds: e.restSeconds?.toString() ?? '',
          notes: e.notes ?? '',
        })),
      }))
    }
    return [newBlock(1)]
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs['name'] = 'El nombre es obligatorio'
    if (blocks.length === 0) errs['blocks'] = 'Debe tener al menos un bloque'
    blocks.forEach((block, bi) => {
      if (!block.name.trim()) errs[`block-${bi}-name`] = 'Nombre del bloque obligatorio'
      block.exercises.forEach((ex, ei) => {
        if (!ex.name.trim()) errs[`block-${bi}-ex-${ei}-name`] = 'Nombre del ejercicio obligatorio'
      })
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      blocks: blocks.map((b, bi) => ({
        name: b.name.trim(),
        dayNumber: b.dayNumber,
        sortOrder: bi * 10,
        exercises: b.exercises.map((e, ei) => ({
          name: e.name.trim(),
          sets: e.sets ? parseInt(e.sets) : null,
          reps: e.reps.trim() || null,
          restSeconds: e.restSeconds ? parseInt(e.restSeconds) : null,
          notes: e.notes.trim() || null,
          sortOrder: ei * 10,
        })),
      })),
    }

    const result = isEdit
      ? await updateTemplate(gymId, template!.id, payload)
      : await createTemplate(gymId, payload)

    setSaving(false)

    if (result.success) {
      router.push(`/gym/${gymId}/coach/templates`)
    } else {
      toast(
        result.status === 409
          ? 'No podés editar una plantilla con rutinas activas asignadas'
          : result.error ?? 'Error al guardar',
        'error'
      )
    }
  }

  function addBlock() {
    setBlocks([...blocks, newBlock(blocks.length + 1)])
  }

  function removeBlock(index: number) {
    setBlocks(blocks.filter((_, i) => i !== index))
  }

  function updateBlock(index: number, field: keyof BlockForm, value: unknown) {
    setBlocks(blocks.map((b, i) => i === index ? { ...b, [field]: value } : b))
  }

  function addExercise(blockIndex: number) {
    setBlocks(blocks.map((b, i) =>
      i === blockIndex ? { ...b, exercises: [...b.exercises, newExercise()] } : b
    ))
  }

  function removeExercise(blockIndex: number, exIndex: number) {
    setBlocks(blocks.map((b, i) =>
      i === blockIndex
        ? { ...b, exercises: b.exercises.filter((_, j) => j !== exIndex) }
        : b
    ))
  }

  function updateExercise(blockIndex: number, exIndex: number, field: keyof ExerciseForm, value: string) {
    setBlocks(blocks.map((b, i) =>
      i === blockIndex
        ? {
            ...b,
            exercises: b.exercises.map((e, j) =>
              j === exIndex ? { ...e, [field]: value } : e
            ),
          }
        : b
    ))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Template name */}
      <div>
        <Input
          placeholder="Nombre de la plantilla"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-xl font-semibold h-12"
        />
        {errors['name'] && <p className="mt-1 text-sm text-destructive">{errors['name']}</p>}
      </div>

      {/* Description */}
      <div>
        <textarea
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {errors['blocks'] && <p className="text-sm text-destructive">{errors['blocks']}</p>}

      {/* Blocks */}
      {blocks.map((block, bi) => (
        <Card key={block.clientId}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Input
                  placeholder="Nombre del bloque"
                  value={block.name}
                  onChange={(e) => updateBlock(bi, 'name', e.target.value)}
                  className="font-medium"
                />
                {errors[`block-${bi}-name`] && (
                  <p className="mt-1 text-sm text-destructive">{errors[`block-${bi}-name`]}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Día</label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={block.dayNumber}
                  onChange={(e) => updateBlock(bi, 'dayNumber', parseInt(e.target.value) || 1)}
                  className="w-16"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => removeBlock(bi)}
                disabled={blocks.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Exercises */}
            {block.exercises.map((exercise, ei) => (
              <div key={exercise.clientId} className="flex items-start gap-2 rounded-md border p-3">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Nombre del ejercicio"
                    value={exercise.name}
                    onChange={(e) => updateExercise(bi, ei, 'name', e.target.value)}
                  />
                  {errors[`block-${bi}-ex-${ei}-name`] && (
                    <p className="text-sm text-destructive">{errors[`block-${bi}-ex-${ei}-name`]}</p>
                  )}
                  <div className="flex gap-2">
                    <div className="w-20">
                      <label className="text-xs text-muted-foreground">Series</label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="4"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(bi, ei, 'sets', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-muted-foreground">Reps</label>
                      <Input
                        placeholder="8-10"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(bi, ei, 'reps', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-muted-foreground">Descanso (s)</label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="90"
                        value={exercise.restSeconds}
                        onChange={(e) => updateExercise(bi, ei, 'restSeconds', e.target.value)}
                      />
                    </div>
                  </div>
                  <Input
                    placeholder="Notas (opcional)"
                    value={exercise.notes}
                    onChange={(e) => updateExercise(bi, ei, 'notes', e.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-1 text-muted-foreground hover:text-destructive"
                  onClick={() => removeExercise(bi, ei)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={() => addExercise(bi)}>
              <Plus className="mr-2 h-3 w-3" />
              Agregar ejercicio
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addBlock} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Agregar bloque
      </Button>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/gym/${gymId}/coach/templates`)}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear plantilla'}
        </Button>
      </div>
    </div>
  )
}
