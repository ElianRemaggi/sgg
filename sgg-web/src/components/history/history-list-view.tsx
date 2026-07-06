'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AssignmentHistorySummaryDto, PageResponse } from '@/lib/api/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { Calendar, ChevronRight, Dumbbell, Zap } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  data: PageResponse<AssignmentHistorySummaryDto>
  basePath: string // /gym/[gymId]/member/history  o  /gym/[gymId]/coach/history/[memberId]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function HistoryListView({ data, basePath }: Props) {
  const assignments = data.content
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'active' | 'past'>('active')

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${basePath}?${params.toString()}`)
  }

  // El split activa/pasadas filtra dentro de la página actual, no del total del backend
  // (el paginado ordena por startsAt DESC, así que la asignación activa —si existe— cae
  // casi siempre en la página 0). La paginación de abajo solo pasa de página en "Pasadas".
  const active = assignments.filter(a => a.isActive)
  const past = assignments.filter(a => !a.isActive)
  const shown = tab === 'active' ? active : past

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {(['active', 'past'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === t
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            )}
          >
            {t === 'active' ? 'Activa' : 'Pasadas'}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">
          {tab === 'active' ? 'No tenés rutina activa.' : 'No hay rutinas pasadas aún.'}
        </p>
      )}

      <div className="space-y-3">
        {shown.map(a => (
          <Link key={a.id} href={`${basePath}/${a.id}`}>
            <Card className="card-hover cursor-pointer border-border/60 hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-semibold text-foreground truncate">{a.templateName}</span>
                      {a.isActive && (
                        <Badge variant="outline" className="border-tertiary/40 text-tertiary text-xs shrink-0">
                          Activa
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(a.startsAt)}
                        {a.endsAt ? ` → ${formatDate(a.endsAt)}` : ' → sin vencimiento'}
                      </span>
                    </div>

                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="flex items-center gap-1 text-primary/80">
                        <Dumbbell size={11} />
                        {a.totalCompletions} completions
                      </span>
                      <span className="flex items-center gap-1 text-secondary-vivid/80">
                        <Zap size={11} />
                        {a.totalSessionDays} días entrenados
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {tab === 'past' && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          last={data.last}
          onPageChange={goToPage}
          itemLabel="asignaciones"
        />
      )}
    </div>
  )
}
