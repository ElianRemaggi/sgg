export const queryKeys = {
  memberships: () => ['memberships'] as const,
  memberRoutine: (gymId: string) => ['member', gymId, 'routine'] as const,
  memberProgress: (gymId: string) => ['member', gymId, 'progress'] as const,
  memberRoutineHistory: (gymId: string) => ['member', gymId, 'routineHistory'] as const,
  gymSearch: (slug: string) => ['gym', 'search', slug] as const,
  gymInfo: (gymId: string) => ['gym', gymId, 'info'] as const,
  gymSchedule: (gymId: string) => ['gym', gymId, 'schedule'] as const,
  assignmentDetail: (gymId: string, assignmentId: string) => ['member', gymId, 'history', assignmentId] as const,
  exerciseProgress: (gymId: string, assignmentId: string, exerciseId: string) => ['member', gymId, 'history', assignmentId, 'exercise', exerciseId] as const,
  currentUser: () => ['currentUser'] as const,
}
