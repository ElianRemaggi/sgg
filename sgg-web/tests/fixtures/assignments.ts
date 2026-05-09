import type {
  AssignmentHistorySummaryDto,
  AssignmentHistoryDetailDto,
} from '@/lib/api/types'

export const activeAssignment: AssignmentHistorySummaryDto = {
  id: 1,
  templateName: 'Hipertrofia Vol. A',
  startsAt: '2026-01-01T00:00:00Z',
  endsAt: null,
  isActive: true,
  totalSessionDays: 12,
  totalCompletions: 48,
  lastActivityAt: '2026-05-08T10:00:00Z',
}

export const pastAssignment: AssignmentHistorySummaryDto = {
  id: 2,
  templateName: 'Fuerza 5x5',
  startsAt: '2025-09-01T00:00:00Z',
  endsAt: '2025-12-01T00:00:00Z',
  isActive: false,
  totalSessionDays: 40,
  totalCompletions: 120,
  lastActivityAt: '2025-11-30T10:00:00Z',
}

export const assignmentSummaries: AssignmentHistorySummaryDto[] = [
  activeAssignment,
  pastAssignment,
]

export const assignmentDetail: AssignmentHistoryDetailDto = {
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
          sessionsCount: 10,
          bestWeightKg: 90,
          avgWeightKg: 82,
          lastWeightKg: 88,
        },
        {
          exerciseId: 101,
          name: 'Press Hombros',
          sessionsCount: 5,
          bestWeightKg: null,
          avgWeightKg: null,
          lastWeightKg: null,
        },
      ],
    },
  ],
  stats: {
    totalDistinctDays: 12,
    totalCompletions: 48,
    firstActivityAt: '2026-01-02T10:00:00Z',
    lastActivityAt: '2026-05-08T10:00:00Z',
  },
}
