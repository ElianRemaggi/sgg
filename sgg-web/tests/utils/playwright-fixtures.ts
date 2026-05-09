import { test as base, type Page } from '@playwright/test'
import { memberUser, coachUser, memberMembership, coachMembership } from '../fixtures/users'

async function setupAuth(page: Page, user: typeof memberUser) {
  await page.context().addCookies([
    {
      name: 'sgg-token',
      value: 'fake-e2e-token',
      domain: 'localhost',
      path: '/',
    },
  ])
  await page.route('**/api/users/me', route =>
    route.fulfill({ json: { success: true, data: user } })
  )
}

export async function loginAsMember(page: Page) {
  await setupAuth(page, memberUser)
  await page.route('**/api/users/me/memberships', route =>
    route.fulfill({ json: { success: true, data: [memberMembership] } })
  )
}

export async function loginAsCoach(page: Page) {
  await setupAuth(page, coachUser)
  await page.route('**/api/users/me/memberships', route =>
    route.fulfill({ json: { success: true, data: [coachMembership] } })
  )
}

export const test = base
export { expect } from '@playwright/test'
