import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import type { MemberRoutineDto, TrackingProgressDto } from '@/types/api'

interface Props {
  routine: MemberRoutineDto
  progress: TrackingProgressDto
  selectedDay: number
  onSelectDay: (day: number) => void
}

export function RoutineProgressBar({ routine, progress, selectedDay, onSelectDay }: Props) {
  const totalToday = progress.totalExercisesToday ?? progress.totalExercises
  const percent = totalToday > 0 ? (progress.completedToday / totalToday) * 100 : 0

  return (
    <View className="gap-3">
      {/* Progress card */}
      <View className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 gap-3">
        <View className="flex-row items-center justify-between">
          <View>
            {progress.currentDayNumber != null && progress.currentBlockName != null && (
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Día {progress.currentDayNumber} — {progress.currentBlockName}
                </Text>
                <View className="bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-green-700 dark:text-green-300">hoy</Text>
                </View>
              </View>
            )}
          </View>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            {progress.completedToday} / {totalToday}
          </Text>
        </View>

        <View className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <View
            className="h-full rounded-full bg-green-500"
            style={{ width: `${Math.round(percent)}%` }}
          />
        </View>

        <View className="flex-row gap-4">
          <Text className="text-xs text-slate-400 dark:text-slate-500">
            Total: {progress.completedTotal}/{progress.totalExercises} ({progress.progressPercent}%)
          </Text>
          {progress.lastActivityAt && (
            <Text className="text-xs text-slate-400 dark:text-slate-500">
              Último: {new Date(progress.lastActivityAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </View>

      {/* Day tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-1">
        {routine.blocks.map((block) => {
          const isToday = progress.currentDayNumber === block.dayNumber
          const isSelected = selectedDay === block.dayNumber
          return (
            <TouchableOpacity
              key={block.dayNumber}
              onPress={() => onSelectDay(block.dayNumber)}
              className={[
                'px-4 py-2 rounded-lg mr-1',
                isSelected ? 'bg-green-600' : 'bg-slate-100 dark:bg-slate-800',
                isToday && !isSelected ? 'ring-2 ring-green-500' : '',
              ].join(' ')}
            >
              <Text className={['text-sm font-medium', isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'].join(' ')}>
                Día {block.dayNumber}
                {isToday ? '  ●' : ''}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}
