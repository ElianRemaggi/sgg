import Link from 'next/link'
import { apiClient } from '@/lib/api/client'
import { ApiResponse, GymDetailDto } from '@/lib/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GymDetailActions } from './gym-detail-actions'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  DELETED: 'bg-gray-100 text-gray-500',
}

interface Props {
  params: Promise<{ gymId: string }>
}

export default async function GymDetailPage({ params }: Props) {
  const { gymId } = await params
  const res = await apiClient<ApiResponse<GymDetailDto>>(`/api/platform/gyms/${gymId}`)
  const gym = res.data

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/platform/gyms" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; Volver a gimnasios
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{gym.name}</h1>
          <p className="text-muted-foreground">{gym.slug}</p>
        </div>
        <Badge className={statusColors[gym.status] || ''}>{gym.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Miembros activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{gym.stats.activeMembers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Coaches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{gym.stats.coaches}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plantillas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{gym.stats.templates}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {gym.description && (
              <div>
                <span className="font-medium">Descripcion:</span>
                <p className="text-muted-foreground">{gym.description}</p>
              </div>
            )}
            <div>
              <span className="font-medium">Ciclo de rutina:</span>
              <span className="ml-2 text-muted-foreground">
                {gym.routineCycle === 'WEEKLY' ? 'Semanal' : 'Mensual'}
              </span>
            </div>
            <div>
              <span className="font-medium">Creado:</span>
              <span className="ml-2 text-muted-foreground">
                {new Date(gym.createdAt).toLocaleDateString('es-AR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {gym.owner ? (
              <div>
                <p className="font-medium">{gym.owner.fullName}</p>
                <p className="text-muted-foreground">{gym.owner.email}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Sin owner asignado</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href={`/gym/${gym.id}/admin/members`}>
          <Button variant="outline">Entrar como admin</Button>
        </Link>
      </div>

      <GymDetailActions gym={gym} />
    </div>
  )
}
