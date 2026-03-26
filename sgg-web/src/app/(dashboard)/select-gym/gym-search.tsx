'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { GymPublicDto } from '@/lib/api/types'
import { searchGymsAction, joinGymAction } from './actions'

export function GymSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GymPublicDto[]>([])
  const [searching, setSearching] = useState(false)
  const [joiningId, setJoiningId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    setMessage(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await searchGymsAction(value.trim())
      setResults(res.gyms)
      setSearching(false)
    }, 300)
  }, [])

  async function handleJoin(gymId: number) {
    setJoiningId(gymId)
    setMessage(null)

    const res = await joinGymAction(gymId)

    if (res.success && res.data) {
      if (res.data.status === 'ACTIVE') {
        setMessage({ type: 'success', text: `Te uniste a ${res.data.gymName}` })
        router.refresh()
      } else {
        setMessage({ type: 'success', text: 'Solicitud enviada, esperá aprobación del administrador' })
      }
      setResults(prev => prev.filter(g => g.id !== gymId))
    } else {
      setMessage({ type: 'error', text: res.error ?? 'Error al unirse' })
    }

    setJoiningId(null)
  }

  return (
    <div>
      <Input
        placeholder="Buscá por nombre del gym..."
        value={query}
        onChange={e => handleSearch(e.target.value)}
      />

      {message && (
        <div className={`mt-3 rounded-lg px-4 py-2 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {searching && (
        <p className="mt-3 text-sm text-muted-foreground">Buscando...</p>
      )}

      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">No se encontraron gimnasios</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 grid gap-3">
          {results.map(gym => (
            <Card key={gym.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {gym.logoUrl ? (
                      <img src={gym.logoUrl} alt={gym.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                        {gym.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{gym.name}</CardTitle>
                      <CardDescription className="text-xs">{gym.slug}</CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoin(gym.id)}
                    disabled={joiningId !== null}
                  >
                    {joiningId === gym.id ? 'Uniendo...' : 'Unirse'}
                  </Button>
                </div>
              </CardHeader>
              {gym.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{gym.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
