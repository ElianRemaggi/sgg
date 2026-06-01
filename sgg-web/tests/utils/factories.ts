import type {
  AssignmentHistorySummaryDto,
  AssignmentHistoryDetailDto,
  ExerciseProgressDto,
  TrackingProgressDto,
  MemberRoutineDto,
  TemplateExerciseDto,
  ExerciseCompletionDto,
} from '@/lib/api/types'

export const aAssignmentSummary = (
  overrides: Partial<AssignmentHistorySummaryDto> = {}
): AssignmentHistorySummaryDto => ({
  id: 1,
  templateName: 'Hipertrofia Vol. A',
  startsAt: '2026-01-01T00:00:00Z',
  endsAt: null,
  isActive: true,
  totalSessionDays: 10,
  totalCompletions: 40,
  lastActivityAt: '2026-05-01T10:00:00Z',
  ...overrides,
})

export const aAssignmentDetail = (
  overrides: Partial<AssignmentHistoryDetailDto> = {}
): AssignmentHistoryDetailDto => ({
  id: 1,
  templateName: 'Hipertrofia Vol. A',
  startsAt: '2026-01-01T00:00:00Z',
  endsAt: null,
  isActive: true,
  blocks: [
    {
      id: 10,
      name: 'Push',
      dayNumber: 1,
      exercises: [
        {
          exerciseId: 100,
          name: 'Press Banca',
          sessionsCount: 8,
          bestWeightKg: 90,
          avgWeightKg: 82,
          lastWeightKg: 88,
        },
      ],
    },
  ],
  stats: {
    totalDistinctDays: 10,
    totalCompletions: 40,
    firstActivityAt: '2026-01-02T10:00:00Z',
    lastActivityAt: '2026-05-01T10:00:00Z',
  },
  ...overrides,
})

export const aExerciseProgress = (
  overrides: Partial<ExerciseProgressDto> = {}
): ExerciseProgressDto => ({
  exerciseId: 100,
  exerciseName: 'Press Banca',
  blockName: 'Push',
  dayNumber: 1,
  sessions: [
    { sessionDate: '2026-01-10', weightKg: 70, actualReps: 8, notes: null, isCompleted: true, completedAt: '2026-01-10T10:00:00Z' },
    { sessionDate: '2026-02-10', weightKg: 80, actualReps: 8, notes: null, isCompleted: true, completedAt: '2026-02-10T10:00:00Z' },
    { sessionDate: '2026-03-10', weightKg: 90, actualReps: 7, notes: null, isCompleted: true, completedAt: '2026-03-10T10:00:00Z' },
  ],
  stats: {
    sessionsCount: 3,
    bestWeightKg: 90,
    avgWeightKg: 80,
    firstWeightKg: 70,
    lastWeightKg: 90,
    deltaPercent: 28.6,
  },
  ...overrides,
})

export const aExercise = (overrides: Partial<TemplateExerciseDto> = {}): TemplateExerciseDto => ({
  id: 1,
  name: 'Press Banca',
  sets: 4,
  reps: '8-10',
  restSeconds: 90,
  notes: null,
  sortOrder: 1,
  ...overrides,
})

export const aCompletion = (overrides: Partial<ExerciseCompletionDto> = {}): ExerciseCompletionDto => ({
  exerciseId: 1,
  isCompleted: true,
  weightKg: 80,
  actualReps: 8,
  notes: null,
  completedAt: '2026-05-08T10:00:00Z',
  ...overrides,
})

export const aRoutine = (overrides: Partial<MemberRoutineDto> = {}): MemberRoutineDto => ({
  assignmentId: 1,
  templateName: 'Hipertrofia Vol. A',
  startsAt: '2026-01-01T00:00:00Z',
  endsAt: null,
  blocks: [
    {
      id: 10,
      name: 'Push',
      dayNumber: 1,
      sortOrder: 1,
      exercises: [aExercise()],
    },
  ],
  ...overrides,
})

export const aTracking = (overrides: Partial<TrackingProgressDto> = {}): TrackingProgressDto => ({
  assignmentId: 1,
  totalExercises: 3,
  completedToday: 0,
  completedTotal: 10,
  progressPercent: 33,
  lastActivityAt: null,
  completions: [],
  previousNotesByExerciseId: {},
  currentDayNumber: 1,
  currentBlockName: 'Push',
  totalExercisesToday: 3,
  ...overrides,
})
