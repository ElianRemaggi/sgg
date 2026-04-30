'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { UserSearchDto } from '@/lib/api/types'
import { createGymAction, searchUsersAction } from '../actions'

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export default function CreateGymPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [routineCycle, setRoutineCycle] = useState('WEEKLY')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerResults, setOwnerResults] = useState<UserSearchDto[]>([])
  const [selectedOwner, setSelectedOwner] = useState<UserSearchDto | null>(null)

  const slugPattern = /^[a-z0-9-]*$/

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManual) {
      setSlug(nameToSlug(value))
    }
  }

  const searchOwner = useCallback(async (search: string) => {
    if (!search || search.length < 2) {
      setOwnerResults([])
      return
    }
    const result = await searchUsersAction(search)
    if (result.success) {
      setOwnerResults(result.users)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchOwner(ownerSearch), 300)
    return () => clearTimeout(timer)
  }, [ownerSearch, searchOwner])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOwner) {
      toast('Selecciona un owner', 'error')
      return
    }

    startTransition(async () => {
      const result = await createGymAction({
        name,
        slug,
        description: description || undefined,
        logoUrl: logoUrl || undefined,
        routineCycle,
        ownerUserId: selectedOwner.id,
      })

      if (result.success && result.gymId) {
        toast('Gym creado exitosamente', 'success')
        router.push(`/platform/gyms/${result.gymId}`)
      } else {
        toast(result.error ?? 'Error al crear gym', 'error')
      }
    })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Crear gym</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre *</label>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="CrossFit Norte"
            maxLength={200}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Slug *</label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlugManual(true)
              setSlug(e.target.value)
            }}
            placeholder="crossfit-norte"
            maxLength={100}
            required
          />
          {slug && !slugPattern.test(slug) && (
            <p className="mt-1 text-sm text-destructive">Solo letras minusculas, numeros y guiones</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descripcion</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripcion del gym..."
            maxLength={1000}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Logo URL</label>
          <Input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            maxLength={500}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Ciclo de rutina *</label>
          <select
            value={routineCycle}
            onChange={(e) => setRoutineCycle(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="WEEKLY">Semanal</option>
            <option value="MONTHLY">Mensual</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Owner *</label>
          {selectedOwner ? (
            <div className="flex items-center gap-3 rounded-md border p-3">
              <div>
                <div className="font-medium">{selectedOwner.fullName}</div>
                <div className="text-sm text-muted-foreground">{selectedOwner.email}</div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setSelectedOwner(null)
                  setOwnerSearch('')
                }}
              >
                Cambiar
              </Button>
            </div>
          ) : (
            <div>
              <Input
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
              />
              {ownerResults.length > 0 && (
                <ul className="mt-1 rounded-md border bg-background">
                  {ownerResults.map((user) => (
                    <li
                      key={user.id}
                      className="cursor-pointer px-3 py-2 hover:bg-accent"
                      onClick={() => {
                        setSelectedOwner(user)
                        setOwnerResults([])
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
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || !slugPattern.test(slug)}>
            {isPending ? 'Creando...' : 'Crear gym'}
          </Button>
        </div>
      </form>
    </div>
  )
}
