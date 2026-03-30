'use client'

import { useState, useRef, useEffect } from 'react'
import type { RoutineTemplateSummaryDto, GymMemberDto } from '@/lib/api/types'
import { assignRoutine } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'

interface AssignViewProps {
  templates: RoutineTemplateSummaryDto[]
  members: GymMemberDto[]
  gymId: string
}

export function AssignView({ templates, members, gymId }: AssignViewProps) {
  const [selectedMember, setSelectedMember] = useState<number | ''>('')
  const [memberSearch, setMemberSearch] = useState('')
  const [memberOpen, setMemberOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<number | ''>('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const memberRef = useRef<HTMLDivElement>(null)

  const filteredMembers = memberSearch.trim()
    ? members.filter(m =>
        m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members

  const selectedMemberData = members.find(m => m.userId === selectedMember)
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (memberRef.current && !memberRef.current.contains(e.target as Node)) {
        setMemberOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectMember(userId: number) {
    setSelectedMember(userId)
    setMemberSearch('')
    setMemberOpen(false)
  }

  function clearMember() {
    setSelectedMember('')
    setMemberSearch('')
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!selectedMember) errs['member'] = 'Seleccioná un miembro'
    if (!selectedTemplate) errs['template'] = 'Seleccioná una plantilla'
    if (!startsAt) errs['startsAt'] = 'La fecha de inicio es obligatoria'
    if (endsAt && startsAt && new Date(endsAt) <= new Date(startsAt)) {
      errs['endsAt'] = 'La fecha de fin debe ser posterior al inicio'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)

    const result = await assignRoutine(gymId, {
      templateId: selectedTemplate as number,
      memberUserId: selectedMember as number,
      startsAt: `${startsAt}T00:00:00`,
      endsAt: endsAt ? `${endsAt}T23:59:59` : null,
    })

    setSaving(false)

    if (result.success) {
      const memberName = selectedMemberData?.fullName ?? 'el miembro'
      toast(`Rutina asignada a ${memberName}`, 'success')
      setSelectedMember('')
      setMemberSearch('')
      setSelectedTemplate('')
      setStartsAt('')
      setEndsAt('')
      setErrors({})
    } else {
      toast(result.error ?? 'Error al asignar la rutina', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formulario de asignación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Member search + dropdown */}
          <div ref={memberRef} className="relative">
            <label className="mb-1 block text-sm font-medium">Miembro</label>
            {selectedMember && selectedMemberData ? (
              <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                <span>{selectedMemberData.fullName} <span className="text-muted-foreground">({selectedMemberData.email})</span></span>
                <button
                  type="button"
                  onClick={clearMember}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  &times;
                </button>
              </div>
            ) : (
              <Input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={memberSearch}
                onChange={(e) => { setMemberSearch(e.target.value); setMemberOpen(true) }}
                onFocus={() => setMemberOpen(true)}
              />
            )}
            {memberOpen && !selectedMember && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
                {filteredMembers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
                ) : (
                  filteredMembers.map(m => (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => handleSelectMember(m.userId)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                    >
                      {m.fullName} <span className="text-muted-foreground">({m.email})</span>
                    </button>
                  ))
                )}
              </div>
            )}
            {errors['member'] && <p className="mt-1 text-sm text-destructive">{errors['member']}</p>}
          </div>

          {/* Template select */}
          <div>
            <label className="mb-1 block text-sm font-medium">Plantilla de rutina</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Seleccionar plantilla...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.blocksCount} bloque{t.blocksCount !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
            {errors['template'] && <p className="mt-1 text-sm text-destructive">{errors['template']}</p>}
          </div>

          {/* Template preview */}
          {selectedTemplateData && (
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="text-sm font-medium">{selectedTemplateData.name}</p>
              {selectedTemplateData.description && (
                <p className="mt-1 text-sm text-muted-foreground">{selectedTemplateData.description}</p>
              )}
              <Badge variant="secondary" className="mt-2">
                {selectedTemplateData.blocksCount} bloque{selectedTemplateData.blocksCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Fecha de inicio</label>
              <Input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
              {errors['startsAt'] && <p className="mt-1 text-sm text-destructive">{errors['startsAt']}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fecha de fin (opcional)</label>
              <Input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
              {errors['endsAt'] && <p className="mt-1 text-sm text-destructive">{errors['endsAt']}</p>}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? 'Asignando...' : 'Asignar rutina'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
