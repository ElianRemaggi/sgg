import { http, HttpResponse } from 'msw'
import { memberUser, memberMembership } from '../fixtures/users'
import { assignmentSummaries, assignmentDetail } from '../fixtures/assignments'
import { trackingProgress, exerciseProgress } from '../fixtures/progress'

const BASE = 'http://localhost:8080'

export const handlers = [
  // Auth
  http.get(`${BASE}/api/users/me`, () =>
    HttpResponse.json({ success: true, data: memberUser })
  ),

  http.get(`${BASE}/api/users/me/memberships`, () =>
    HttpResponse.json({ success: true, data: [memberMembership] })
  ),

  http.post(`${BASE}/api/public/auth/login`, () =>
    HttpResponse.json({ success: true, data: { token: 'mock-jwt-token' } })
  ),

  // Routine & tracking
  http.get(`${BASE}/api/gyms/:gymId/member/routine`, () =>
    HttpResponse.json({
      success: true,
      data: {
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
            exercises: [
              { id: 1, name: 'Press Banca', sets: 4, reps: '8-10', restSeconds: 90, notes: null, sortOrder: 1 },
              { id: 2, name: 'Press Hombros', sets: 3, reps: '10-12', restSeconds: 60, notes: null, sortOrder: 2 },
            ],
          },
        ],
      },
    })
  ),

  http.get(`${BASE}/api/gyms/:gymId/member/tracking/progress`, () =>
    HttpResponse.json({ success: true, data: trackingProgress })
  ),

  http.post(`${BASE}/api/gyms/:gymId/member/tracking/complete`, () =>
    HttpResponse.json({ success: true })
  ),

  http.post(`${BASE}/api/gyms/:gymId/member/tracking/undo`, () =>
    HttpResponse.json({ success: true })
  ),

  // Member history
  http.get(`${BASE}/api/gyms/:gymId/member/history/assignments`, () =>
    HttpResponse.json({ success: true, data: assignmentSummaries })
  ),

  http.get(`${BASE}/api/gyms/:gymId/member/history/assignments/:assignmentId`, ({ params }) => {
    if (params.assignmentId === '999') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }
    return HttpResponse.json({ success: true, data: assignmentDetail })
  }),

  http.get(
    `${BASE}/api/gyms/:gymId/member/history/assignments/:assignmentId/exercises/:exerciseId`,
    () => HttpResponse.json({ success: true, data: exerciseProgress })
  ),

  // Coach history
  http.get(`${BASE}/api/gyms/:gymId/coach/history/:memberId/assignments`, () =>
    HttpResponse.json({ success: true, data: assignmentSummaries })
  ),

  http.get(`${BASE}/api/gyms/:gymId/coach/history/:memberId/assignments/:assignmentId`, () =>
    HttpResponse.json({ success: true, data: assignmentDetail })
  ),

  http.get(
    `${BASE}/api/gyms/:gymId/coach/history/:memberId/assignments/:assignmentId/exercises/:exerciseId`,
    () => HttpResponse.json({ success: true, data: exerciseProgress })
  ),

  // Gyms
  http.get(`${BASE}/api/gyms`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
]
