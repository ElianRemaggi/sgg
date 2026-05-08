'use client'

import { ExerciseProgressDto, ExerciseSessionDto } from '@/lib/api/types'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  progress: ExerciseProgressDto
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | null
  color: 'primary' | 'tertiary' | 'cyan' | 'muted'
}) {
  const colorClass = {
    primary: 'text-primary border-primary/25',
    tertiary: 'text-tertiary border-tertiary/25',
    cyan: 'text-secondary-vivid border-secondary-vivid/25',
    muted: 'text-muted-foreground border-border/60',
  }[color]

  return (
    <Card className={cn('border', colorClass.split(' ')[1])}>
      <CardContent className="p-4 text-center">
        <div className={cn('text-2xl font-bold', colorClass.split(' ')[0])}>
          {value ?? '—'}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </CardContent>
    </Card>
  )
}

function WeightChart({ sessions }: { sessions: ExerciseSessionDto[] }) {
  const withWeight = sessions.filter(s => s.isCompleted && s.weightKg !== null)
  if (withWeight.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
        {withWeight.length === 0
          ? 'Sin datos de peso registrados'
          : 'Necesitás al menos 2 sesiones con peso para ver el gráfico'}
      </div>
    )
  }

  const weights = withWeight.map(s => s.weightKg as number)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = maxW - minW || 1

  const W = 560
  const H = 120
  const PAD = { top: 12, right: 16, bottom: 24, left: 40 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const points = withWeight.map((s, i) => ({
    x: PAD.left + (i / (withWeight.length - 1)) * chartW,
    y: PAD.top + chartH - ((s.weightKg! - minW) / range) * chartH,
    weight: s.weightKg!,
    date: new Date(s.sessionDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
  }))

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')

  const yTicks = [minW, minW + (range / 2), maxW].filter((v, i, arr) => arr.indexOf(v) === i)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      {/* Y grid lines */}
      {yTicks.map(v => {
        const y = PAD.top + chartH - ((v - minW) / range) * chartH
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(184,180,255,0.08)" strokeWidth={1} />
            <text x={PAD.left - 4} y={y + 3.5} textAnchor="end" fontSize={9} fill="rgba(184,180,255,0.4)">
              {v}
            </text>
          </g>
        )
      })}

      {/* Gradient fill */}
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(241 100% 88%)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(241 100% 88%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${points[0].x},${PAD.top + chartH} ${polyline} ${points[points.length - 1].x},${PAD.top + chartH}`}
        fill="url(#chartGrad)"
      />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke="hsl(241 100% 88%)" strokeWidth={2} strokeLinejoin="round" />

      {/* Points + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="hsl(241 100% 88%)" />
          <text x={p.x} y={H - 4} textAnchor="middle" fontSize={8} fill="rgba(184,180,255,0.45)">
            {p.date}
          </text>
        </g>
      ))}
    </svg>
  )
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null
  const positive = delta > 0
  const zero = delta === 0
  const Icon = zero ? Minus : positive ? TrendingUp : TrendingDown
  const colorClass = zero
    ? 'text-muted-foreground'
    : positive
    ? 'text-tertiary'
    : 'text-destructive'

  return (
    <span className={cn('flex items-center gap-1 text-sm font-semibold', colorClass)}>
      <Icon size={14} />
      {positive ? '+' : ''}{delta.toFixed(1)}%
    </span>
  )
}

export function ExerciseProgressView({ progress }: Props) {
  const { stats, sessions } = progress
  const completedSessions = sessions.filter(s => s.isCompleted)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">
          Día {progress.dayNumber} · {progress.blockName}
        </p>
        <h1 className="text-xl font-bold text-foreground">{progress.exerciseName}</h1>
        {stats.deltaPercent !== null && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">variación de peso:</span>
            <DeltaBadge delta={stats.deltaPercent} />
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="mejor peso"
          value={stats.bestWeightKg !== null ? `${stats.bestWeightKg} kg` : null}
          color="tertiary"
        />
        <StatCard
          label="promedio"
          value={stats.avgWeightKg !== null ? `${stats.avgWeightKg} kg` : null}
          color="primary"
        />
        <StatCard
          label="sesiones"
          value={String(stats.sessionsCount)}
          color="cyan"
        />
        <StatCard
          label="último peso"
          value={stats.lastWeightKg !== null ? `${stats.lastWeightKg} kg` : null}
          color="muted"
        />
      </div>

      {/* Chart */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Progresión de peso (kg)
          </p>
          <WeightChart sessions={sessions} />
        </CardContent>
      </Card>

      {/* Session list */}
      {completedSessions.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Historial de sesiones
            </p>
            <div className="space-y-2">
              {completedSessions.slice().reverse().map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <span className="text-sm text-foreground">
                      {new Date(s.sessionDate).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                    {s.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    {s.weightKg !== null && (
                      <span className="font-semibold text-tertiary">{s.weightKg} kg</span>
                    )}
                    {s.actualReps !== null && (
                      <span className="text-muted-foreground ml-2">{s.actualReps} reps</span>
                    )}
                    {s.weightKg === null && s.actualReps === null && (
                      <span className="text-muted-foreground">completado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
