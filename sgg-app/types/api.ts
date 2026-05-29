export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface GymPublicDto {
  id: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
}

export interface GymDto extends GymPublicDto {
  routineCycle: string
  autoAcceptMembers: boolean
}

export interface GymMemberDto {
  memberId: number
  userId: number
  fullName: string
  email: string
  avatarUrl: string | null
  role: string
  status: string
  membershipExpiresAt: string | null
  joinedAt: string
}

export interface MembershipDto {
  membershipId: number
  gymId: number
  gymName: string
  gymSlug: string
  gymLogoUrl: string | null
  role: string
  status: string
  membershipExpiresAt: string | null
}

export interface JoinRequestResponse {
  membershipId: number
  status: string
  gymName: string
}

export type MemberRole = 'MEMBER' | 'COACH' | 'ADMIN' | 'ADMIN_COACH'
export type MemberStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED' | 'REMOVED' | 'EXPIRED'

export interface TemplateBlockDto {
  id: number
  name: string
  dayNumber: number
  sortOrder: number
  exercises: TemplateExerciseDto[]
}

export interface TemplateExerciseDto {
  id: number
  name: string
  sets: number | null
  reps: string | null
  restSeconds: number | null
  notes: string | null
  sortOrder: number
}

export interface MemberRoutineDto {
  assignmentId: number
  templateName: string
  startsAt: string
  endsAt: string | null
  blocks: TemplateBlockDto[]
}

export interface ExerciseCompletionDto {
  exerciseId: number
  isCompleted: boolean
  weightKg: number | null
  actualReps: number | null
  notes: string | null
  completedAt: string
}

export interface TrackingProgressDto {
  assignmentId: number
  totalExercises: number
  completedToday: number
  completedTotal: number
  progressPercent: number
  lastActivityAt: string | null
  completions: ExerciseCompletionDto[]
  previousNotesByExerciseId: Record<number, string>
  currentDayNumber?: number
  currentBlockName?: string
  totalExercisesToday?: number
}

export interface UserDto {
  id: number
  fullName: string
  email: string
  avatarUrl: string | null
  platformRole: string
}

export interface RoutineHistorySummaryDto {
  id: number
  templateName: string
  startsAt: string
  endsAt: string | null
  isActive: boolean
  totalSessionDays: number
  totalCompletions: number
  lastActivityAt: string | null
}

export interface ScheduleActivityDto {
  id: number
  name: string
  description: string | null
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  isActive: boolean
}

export interface AssignmentHistoryDetailDto {
  id: number
  templateName: string
  startsAt: string
  endsAt: string | null
  isActive: boolean
  blocks: HistoryBlockDto[]
  stats: HistoryStatsDto
}

export interface HistoryBlockDto {
  id: number
  name: string
  dayNumber: number
  exercises: HistoryExerciseSummaryDto[]
}

export interface HistoryExerciseSummaryDto {
  exerciseId: number
  name: string
  sessionsCount: number
  bestWeightKg: number | null
  avgWeightKg: number | null
  lastWeightKg: number | null
}

export interface HistoryStatsDto {
  totalDistinctDays: number
  totalCompletions: number
  firstActivityAt: string | null
  lastActivityAt: string | null
}

export interface ExerciseProgressDto {
  exerciseId: number
  exerciseName: string
  blockName: string
  dayNumber: number
  sessions: ExerciseSessionDto[]
  stats: ExerciseStatsDto
}

export interface ExerciseSessionDto {
  sessionDate: string
  weightKg: number | null
  actualReps: number | null
  notes: string | null
  isCompleted: boolean
  completedAt: string
}

export interface ExerciseStatsDto {
  sessionsCount: number
  bestWeightKg: number | null
  avgWeightKg: number | null
  firstWeightKg: number | null
  lastWeightKg: number | null
  deltaPercent: number | null
}
