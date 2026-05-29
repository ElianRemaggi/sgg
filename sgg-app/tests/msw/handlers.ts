import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8080'

export const handlers = [
  http.post(`${BASE}/api/public/auth/login`, () =>
    HttpResponse.json({
      success: true,
      data: { token: 'test-jwt', user: { id: 1, fullName: 'Test User', email: 'test@test.com' } },
    })
  ),

  http.get(`${BASE}/api/users/me/memberships`, () =>
    HttpResponse.json({
      success: true,
      data: [
        {
          membershipId: 1,
          gymId: 1,
          gymName: 'CrossFit Palermo',
          gymSlug: 'crossfit-palermo',
          gymLogoUrl: null,
          role: 'MEMBER',
          status: 'ACTIVE',
          membershipExpiresAt: null,
        },
      ],
    })
  ),

  http.get(`${BASE}/api/gyms/search`, () =>
    HttpResponse.json({
      success: true,
      data: { id: 2, name: 'Iron Gym', slug: 'iron-gym', description: null, logoUrl: null },
    })
  ),

  http.post(`${BASE}/api/gyms/:gymId/join-request`, () =>
    HttpResponse.json({
      success: true,
      data: { membershipId: 3, status: 'PENDING', gymName: 'Iron Gym' },
    })
  ),

  http.get(`${BASE}/api/gyms/:gymId/member/routine`, () =>
    HttpResponse.json({
      success: true,
      data: {
        assignmentId: 10,
        templateName: 'Rutina A',
        startsAt: '2024-01-01',
        endsAt: null,
        blocks: [
          {
            id: 1,
            name: 'Push',
            dayNumber: 1,
            sortOrder: 1,
            exercises: [
              {
                id: 1,
                name: 'Press banca',
                sets: 3,
                reps: '8-10',
                restSeconds: 90,
                notes: null,
                sortOrder: 1,
              },
            ],
          },
        ],
      },
    })
  ),

  http.get(`${BASE}/api/gyms/:gymId/member/tracking/progress`, () =>
    HttpResponse.json({
      success: true,
      data: {
        assignmentId: 10,
        totalExercises: 5,
        completedToday: 2,
        completedTotal: 10,
        progressPercent: 40,
        lastActivityAt: null,
        completions: [],
        previousNotesByExerciseId: {},
        currentDayNumber: 1,
        currentBlockName: 'Push',
        totalExercisesToday: 5,
      },
    })
  ),

  http.get(`${BASE}/api/gyms/:gymId/member/history/assignments`, () =>
    HttpResponse.json({
      success: true,
      data: [
        {
          id: 10,
          templateName: 'Rutina A',
          startsAt: '2024-01-01',
          endsAt: '2024-06-01',
          isActive: false,
          totalSessionDays: 15,
          totalCompletions: 45,
          lastActivityAt: '2024-05-30T10:00:00',
        },
        {
          id: 11,
          templateName: 'Rutina B',
          startsAt: '2024-06-15',
          endsAt: null,
          isActive: true,
          totalSessionDays: 5,
          totalCompletions: 15,
          lastActivityAt: '2024-07-01T10:00:00',
        },
      ],
    })
  ),

  http.get(
    `${BASE}/api/gyms/:gymId/member/history/assignments/:assignmentId`,
    () =>
      HttpResponse.json({
        success: true,
        data: {
          id: 10,
          templateName: 'Rutina A',
          startsAt: '2024-01-01',
          endsAt: '2024-06-01',
          isActive: false,
          blocks: [
            {
              id: 1,
              name: 'Push',
              dayNumber: 1,
              exercises: [
                {
                  exerciseId: 1,
                  name: 'Press banca',
                  sessionsCount: 5,
                  bestWeightKg: 80,
                  avgWeightKg: 72.5,
                  lastWeightKg: 75,
                },
              ],
            },
          ],
          stats: {
            totalDistinctDays: 15,
            totalCompletions: 45,
            firstActivityAt: '2024-01-03T10:00:00',
            lastActivityAt: '2024-05-30T10:00:00',
          },
        },
      })
  ),

  http.get(
    `${BASE}/api/gyms/:gymId/member/history/assignments/:assignmentId/exercises/:exerciseId`,
    () =>
      HttpResponse.json({
        success: true,
        data: {
          exerciseId: 1,
          exerciseName: 'Press banca',
          blockName: 'Push',
          dayNumber: 1,
          sessions: [
            {
              sessionDate: '2024-01-03',
              weightKg: 60,
              actualReps: 10,
              notes: null,
              isCompleted: true,
              completedAt: '2024-01-03T10:00:00',
            },
            {
              sessionDate: '2024-03-15',
              weightKg: 75,
              actualReps: 8,
              notes: 'Buena sesión',
              isCompleted: true,
              completedAt: '2024-03-15T10:00:00',
            },
          ],
          stats: {
            sessionsCount: 2,
            bestWeightKg: 75,
            avgWeightKg: 67.5,
            firstWeightKg: 60,
            lastWeightKg: 75,
            deltaPercent: 25.0,
          },
        },
      })
  ),
]
