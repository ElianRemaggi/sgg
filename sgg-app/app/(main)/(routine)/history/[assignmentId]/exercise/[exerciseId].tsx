import React from 'react'
import { ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useColorScheme } from 'nativewind'
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg'
import { apiClient, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useGymStore } from '@/store/gymStore'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorScreen } from '@/components/ui/ErrorScreen'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ApiResponse, ExerciseProgressDto, ExerciseSessionDto } from '@/types/api'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function formatDelta(delta: number | null): string | null {
  if (delta == null) return null
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}%`
}

export default function ExerciseProgressScreen() {
  const { assignmentId, exerciseId } = useLocalSearchParams<{ assignmentId: string; exerciseId: string }>()
  const { selectedGymId } = useGymStore()
  const gymId = selectedGymId!
  const { width } = useWindowDimensions()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.exerciseProgress(gymId, assignmentId, exerciseId),
    queryFn: () =>
      apiClient<ApiResponse<ExerciseProgressDto>>(
        `/api/gyms/${gymId}/member/history/assignments/${assignmentId}/exercises/${exerciseId}`
      ),
  })

  if (isLoading) return <ProgressSkeleton />

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState title="Sin datos" subtitle="No hay progreso registrado para este ejercicio." />
    }
    return <ErrorScreen onRetry={refetch} />
  }

  const progress = data?.data
  if (!progress) return <EmptyState title="Sin datos" subtitle="No hay progreso registrado." />

  const { stats } = progress
  const delta = formatDelta(stats.deltaPercent)

  const completedSessions = [...progress.sessions]
    .filter((s) => s.isCompleted)
    .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerClassName="p-4 gap-4">
        {/* Exercise info */}
        <View className="gap-0.5">
          <Text className="text-xs text-slate-400 dark:text-slate-500">{progress.blockName} · Día {progress.dayNumber}</Text>
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">{progress.exerciseName}</Text>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-2">
          <StatCard label="Mejor" value={stats.bestWeightKg != null ? `${stats.bestWeightKg} kg` : '—'} isDark={isDark} />
          <StatCard label="Promedio" value={stats.avgWeightKg != null ? `${stats.avgWeightKg} kg` : '—'} isDark={isDark} />
          <StatCard label="Primero" value={stats.firstWeightKg != null ? `${stats.firstWeightKg} kg` : '—'} isDark={isDark} />
          {delta && (
            <StatCard
              label="Evolución"
              value={delta}
              valueClass={stats.deltaPercent! > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}
              isDark={isDark}
            />
          )}
        </View>

        {/* Chart */}
        <WeightChart sessions={completedSessions} containerWidth={width - 32} isDark={isDark} />

        {/* Sessions list */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sesiones ({completedSessions.length})</Text>
          {completedSessions.length === 0 ? (
            <Text className="text-sm text-slate-400 dark:text-slate-500">Sin sesiones completadas.</Text>
          ) : (
            <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {[...completedSessions].reverse().map((session, idx) => (
                <SessionRow
                  key={session.sessionDate}
                  session={session}
                  isLast={idx === completedSessions.length - 1}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
  )
}

function WeightChart({
  sessions,
  containerWidth,
  isDark,
}: {
  sessions: ExerciseSessionDto[]
  containerWidth: number
  isDark: boolean
}) {
  const pts = sessions.filter((s) => s.weightKg != null).map((s) => ({
    weight: Number(s.weightKg),
    date: s.sessionDate,
  }))

  if (pts.length < 2) {
    return (
      <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-8 items-center">
        <Text className="text-sm text-slate-400 dark:text-slate-500 text-center">
          Se necesitan al menos 2 sesiones con peso para mostrar el gráfico.
        </Text>
      </View>
    )
  }

  const chartHeight = 150
  const padLeft = 38
  const padRight = 12
  const padY = 18
  const chartW = containerWidth

  const weights = pts.map((p) => p.weight)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = maxW - minW || 1

  const sx = (i: number) => padLeft + (i / (pts.length - 1)) * (chartW - padLeft - padRight)
  const sy = (w: number) => padY + ((maxW - w) / range) * (chartHeight - 2 * padY)

  const polyPoints = pts.map((p, i) => `${sx(i)},${sy(p.weight)}`).join(' ')

  const yLabels = [maxW, (maxW + minW) / 2, minW]

  const gridColor = isDark ? '#1e293b' : '#f1f5f9'
  const labelColor = isDark ? '#64748b' : '#94a3b8'
  const dotStroke = isDark ? '#1e293b' : 'white'

  return (
    <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 py-3 px-1">
      <Svg width={chartW} height={chartHeight}>
        {/* Horizontal grid + Y labels */}
        {yLabels.map((w, i) => (
          <React.Fragment key={i}>
            <Line
              x1={padLeft}
              y1={sy(w)}
              x2={chartW - padRight}
              y2={sy(w)}
              stroke={gridColor}
              strokeWidth={1}
            />
            <SvgText x={2} y={sy(w) + 4} fontSize={9} fill={labelColor}>
              {w % 1 === 0 ? w : w.toFixed(1)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Line */}
        <Polyline
          points={polyPoints}
          fill="none"
          stroke="#16a34a"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {pts.map((p, i) => (
          <Circle
            key={i}
            cx={sx(i)}
            cy={sy(p.weight)}
            r={5}
            fill="#16a34a"
            stroke={dotStroke}
            strokeWidth={2}
          />
        ))}

        {/* X date labels (first and last) */}
        <SvgText x={padLeft} y={chartHeight - 2} fontSize={9} fill={labelColor} textAnchor="middle">
          {formatDate(pts[0].date)}
        </SvgText>
        <SvgText x={chartW - padRight} y={chartHeight - 2} fontSize={9} fill={labelColor} textAnchor="middle">
          {formatDate(pts[pts.length - 1].date)}
        </SvgText>
      </Svg>
    </View>
  )
}

function SessionRow({ session, isLast }: { session: ExerciseSessionDto; isLast: boolean }) {
  return (
    <View
      className={[
        'flex-row items-start gap-3 px-4 py-3',
        !isLast ? 'border-b border-slate-100 dark:border-slate-800' : '',
      ].join(' ')}
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatDate(session.sessionDate)}</Text>
        <View className="flex-row gap-3">
          {session.weightKg != null && (
            <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{session.weightKg} kg</Text>
          )}
          {session.actualReps != null && (
            <Text className="text-sm text-slate-600 dark:text-slate-400">{session.actualReps} reps</Text>
          )}
          {session.weightKg == null && session.actualReps == null && (
            <Text className="text-sm text-slate-400 dark:text-slate-500">Sin datos de peso/reps</Text>
          )}
        </View>
        {session.notes && (
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5" numberOfLines={2}>{session.notes}</Text>
        )}
      </View>
    </View>
  )
}

function StatCard({
  label,
  value,
  valueClass,
  isDark,
}: {
  label: string
  value: string
  valueClass?: string
  isDark: boolean
}) {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 items-center gap-1">
      <Text className={`text-base font-bold ${valueClass ?? 'text-slate-900 dark:text-slate-50'}`}>{value}</Text>
      <Text className="text-xs text-slate-400 dark:text-slate-500 text-center">{label}</Text>
    </View>
  )
}

function ProgressSkeleton() {
  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 gap-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-48" />
        <View className="flex-row gap-2">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 items-center gap-1">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-10" />
            </View>
          ))}
        </View>
        <Skeleton className="h-40 w-full rounded-xl" />
        <View className="gap-2">
          <Skeleton className="h-4 w-32" />
          <View className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            {[1, 2, 3].map((i) => (
              <View key={i} className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-32" />
              </View>
            ))}
          </View>
        </View>
    </View>
  )
}
