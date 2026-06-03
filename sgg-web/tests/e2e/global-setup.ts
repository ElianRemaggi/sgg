import { createServer, IncomingMessage, ServerResponse } from 'http'
import type { FullConfig } from '@playwright/test'

const MOCK_PORT = 4001

function respond(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify(data))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise(resolve => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => resolve(body))
  })
}

export default async function globalSetup(_config: FullConfig) {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url || ''
    const method = req.method?.toUpperCase() || 'GET'

    if (method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' })
      res.end()
      return
    }

    // POST /api/public/auth/login — credential check
    if (method === 'POST' && url.includes('/auth/login')) {
      const body = await readBody(req)
      try {
        const { identifier, password } = JSON.parse(body)
        if (identifier === 'valid@test.com' && password === 'password123') {
          return respond(res, { success: true, data: { token: 'mock-e2e-jwt' } })
        }
        return respond(res, { message: 'Email o contraseña incorrectos' }, 401)
      } catch {
        return respond(res, { message: 'Bad request' }, 400)
      }
    }

    // POST/DELETE — generic success
    if (method === 'POST' || method === 'DELETE') {
      return respond(res, { success: true })
    }

    // GET routes — fixture data
    if (url.includes('/api/users/me/memberships')) {
      return respond(res, {
        success: true,
        data: [{ membershipId: 10, gymId: 1, gymName: 'Test Gym', gymSlug: 'test-gym', gymLogoUrl: null, role: 'MEMBER', status: 'ACTIVE', membershipExpiresAt: null }],
      })
    }

    if (url.includes('/api/users/me')) {
      return respond(res, { success: true, data: { id: 1, fullName: 'Ana Pérez', email: 'member@test.com', avatarUrl: null, platformRole: 'USER' } })
    }

    const routineData = {
      assignmentId: 1,
      templateName: 'Hipertrofia Vol. A',
      startsAt: '2026-01-01T00:00:00Z',
      endsAt: null,
      blocks: [
        {
          id: 10, name: 'Push', dayNumber: 1, sortOrder: 1,
          exercises: [
            { id: 1, name: 'Press Banca', sets: 4, reps: '8-10', restSeconds: 90, notes: null, sortOrder: 1 },
            { id: 2, name: 'Press Hombros', sets: 3, reps: '10-12', restSeconds: 60, notes: null, sortOrder: 2 },
          ],
        },
        {
          id: 11, name: 'Pull', dayNumber: 2, sortOrder: 2,
          exercises: [
            { id: 3, name: 'Dominadas', sets: 4, reps: '6-8', restSeconds: 90, notes: null, sortOrder: 1 },
          ],
        },
      ],
    }

    if (url.match(/\/member\/routine$/) && !url.includes('history')) {
      return respond(res, { success: true, data: routineData })
    }

    if (url.includes('/tracking/progress')) {
      return respond(res, {
        success: true,
        data: { assignmentId: 1, totalExercises: 2, completedToday: 0, completedTotal: 0, progressPercent: 0, lastActivityAt: null, completions: [], currentDayNumber: 1, currentBlockName: 'Push', totalExercisesToday: 2, previousNotesByExerciseId: {} },
      })
    }

    if (url.match(/\/exercises\/\d+/)) {
      return respond(res, {
        success: true,
        data: {
          exerciseId: 1, exerciseName: 'Press Banca', blockName: 'Push', dayNumber: 1,
          sessions: [
            { sessionDate: '2026-01-10', weightKg: 70, actualReps: 8, notes: null, isCompleted: true, completedAt: '2026-01-10T10:00:00Z' },
            { sessionDate: '2026-02-10', weightKg: 80, actualReps: 8, notes: null, isCompleted: true, completedAt: '2026-02-10T10:00:00Z' },
          ],
          stats: { sessionsCount: 2, bestWeightKg: 80, avgWeightKg: 75, firstWeightKg: 70, lastWeightKg: 80, deltaPercent: 14.3 },
        },
      })
    }

    const summaries = [
      { id: 1, templateName: 'Hipertrofia Vol. A', startsAt: '2026-01-01T00:00:00Z', endsAt: null, isActive: true, totalSessionDays: 12, totalCompletions: 48, lastActivityAt: '2026-05-08T10:00:00Z' },
      { id: 2, templateName: 'Fuerza 5x5', startsAt: '2025-09-01T00:00:00Z', endsAt: '2025-12-01T00:00:00Z', isActive: false, totalSessionDays: 40, totalCompletions: 120, lastActivityAt: '2025-11-30T10:00:00Z' },
    ]

    if (url.match(/\/assignments\/\d+$/)) {
      return respond(res, {
        success: true,
        data: {
          id: 1, templateName: 'Hipertrofia Vol. A', startsAt: '2026-01-01T00:00:00Z', endsAt: null, isActive: true,
          blocks: [{ id: 10, name: 'Push', dayNumber: 1, exercises: [{ exerciseId: 100, name: 'Press Banca', sessionsCount: 10, bestWeightKg: 90, avgWeightKg: 82, lastWeightKg: 88 }] }],
          stats: { totalDistinctDays: 12, totalCompletions: 48, firstActivityAt: '2026-01-02T10:00:00Z', lastActivityAt: '2026-05-08T10:00:00Z' },
        },
      })
    }

    if (url.includes('/history')) {
      return respond(res, { success: true, data: summaries })
    }

    // Fallback
    return respond(res, { success: true, data: [] })
  })

  await new Promise<void>(resolve => server.listen(MOCK_PORT, resolve))
  console.log(`[E2E mock API] listening on port ${MOCK_PORT}`)

  return async () => {
    await new Promise<void>((resolve, reject) =>
      server.close(err => (err ? reject(err) : resolve()))
    )
  }
}
