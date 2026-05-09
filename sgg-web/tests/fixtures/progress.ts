import type { TrackingProgressDto, ExerciseProgressDto } from '@/lib/api/types'

export const trackingProgress: TrackingProgressDto = {
  assignmentId: 1,
  totalExercises: 6,
  completedToday: 2,
  completedTotal: 48,
  progressPercent: 33,
  lastActivityAt: '2026-05-08T10:00:00Z',
  completions: [
    {
      exerciseId: 1,
      isCompleted: true,
      weightKg: 80,
      actualReps: 8,
      notes: null,
      completedAt: '2026-05-08T10:00:00Z',
    },
  ],
  currentDayNumber: 1,
  currentBlockName: 'Push',
  totalExercisesToday: 3,
}

export const exerciseProgress: ExerciseProgressDto = {
  exerciseId: 100,
  exerciseName: 'Press Banca',
  blockName: 'Push',
  dayNumber: 1,
  sessions: [
    {
      sessionDate: '2026-01-10',
      weightKg: 70,
      actualReps: 8,
      notes: null,
      isCompleted: true,
      completedAt: '2026-01-10T10:00:00Z',
    },
    {
      sessionDate: '2026-02-10',
      weightKg: 80,
      actualReps: 8,
      notes: 'buena forma',
      isCompleted: true,
      completedAt: '2026-02-10T10:00:00Z',
    },
    {
      sessionDate: '2026-03-10',
      weightKg: 90,
      actualReps: 7,
      notes: null,
      isCompleted: true,
      completedAt: '2026-03-10T10:00:00Z',
    },
  ],
  stats: {
    sessionsCount: 3,
    bestWeightKg: 90,
    avgWeightKg: 80,
    firstWeightKg: 70,
    lastWeightKg: 90,
    deltaPercent: 28.6,
  },
}

export const exerciseProgressNoWeight: ExerciseProgressDto = {
  exerciseId: 101,
  exerciseName: 'Sentadillas sin peso',
  blockName: 'Legs',
  dayNumber: 2,
  sessions: [],
  stats: {
    sessionsCount: 0,
    bestWeightKg: null,
    avgWeightKg: null,
    firstWeightKg: null,
    lastWeightKg: null,
    deltaPercent: null,
  },
}
