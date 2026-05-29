import { View, Text } from 'react-native'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { ExerciseRow } from './ExerciseRow'
import type { ExerciseCompletionDto, TemplateBlockDto, TrackingProgressDto } from '@/types/api'

interface Props {
  gymId: string
  assignmentId: number
  block: TemplateBlockDto
  completionMap: Map<number, ExerciseCompletionDto>
  progress: TrackingProgressDto | null
}

export function BlockSection({ gymId, assignmentId, block, completionMap, progress }: Props) {
  const isToday = progress?.currentDayNumber === block.dayNumber

  return (
    <Card className={isToday ? 'border-green-500 dark:border-green-600' : ''}>
      <CardHeader>
        <CardTitle>
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Día {block.dayNumber} — {block.name}
            </Text>
            {isToday && (
              <View className="bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-green-700 dark:text-green-300">hoy</Text>
              </View>
            )}
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {block.exercises.map((exercise) => (
          <ExerciseRow
            key={exercise.id}
            gymId={gymId}
            assignmentId={assignmentId}
            exercise={exercise}
            completion={completionMap.get(exercise.id)}
            previousNotes={progress?.previousNotesByExerciseId?.[exercise.id] ?? null}
          />
        ))}
      </CardContent>
    </Card>
  )
}
