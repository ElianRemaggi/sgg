import { test, expect } from '@playwright/test'
import { loginAsMember } from '../utils/playwright-fixtures'

const GYM_ID = '1'
const ROUTINE_URL = `/gym/${GYM_ID}/member/routine`

test.describe('Member — routine tracking', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMember(page)
    await page.goto(ROUTINE_URL)
    await page.waitForLoadState('networkidle')
  })

  test('shows routine template name and day tabs', async ({ page }) => {
    await expect(page.getByText('Hipertrofia Vol. A')).toBeVisible()
    await expect(page.getByRole('button', { name: /día 1/i })).toBeVisible()
  })

  test('shows exercise list for the current day', async ({ page }) => {
    await expect(page.getByText('Press Banca')).toBeVisible()
    await expect(page.getByText('Press Hombros')).toBeVisible()
  })

  test('progress bar section is visible', async ({ page }) => {
    await expect(page.getByText(/ejercicios/i)).toBeVisible()
  })

  test('completing an exercise calls the tracking API', async ({ page }) => {
    const completeRequests: string[] = []
    await page.route(`**/member/tracking/complete`, route => {
      completeRequests.push(route.request().url())
      return route.fulfill({ json: { success: true } })
    })

    // Expand first exercise
    const expandBtns = page.locator('button').filter({ has: page.locator('svg') }).first()
    await expandBtns.click()

    // Fill weight and click complete
    await page.getByPlaceholder(/ej: 60/i).fill('80')
    await page.getByRole('button', { name: /completar/i }).click()

    await expect(async () => {
      expect(completeRequests.length).toBeGreaterThan(0)
    }).toPass({ timeout: 5_000 })
  })

  test('switching day tab shows different block', async ({ page }) => {
    const routine = {
      assignmentId: 1,
      templateName: 'Test Routine',
      startsAt: '2026-01-01',
      endsAt: null,
      blocks: [
        { id: 1, name: 'Push', dayNumber: 1, sortOrder: 1, exercises: [{ id: 1, name: 'Press Banca', sets: 4, reps: '8-10', restSeconds: 90, notes: null, sortOrder: 1 }] },
        { id: 2, name: 'Pull', dayNumber: 2, sortOrder: 2, exercises: [{ id: 2, name: 'Dominadas', sets: 4, reps: '6-8', restSeconds: 90, notes: null, sortOrder: 1 }] },
      ],
    }

    await page.route(`**/member/routine`, route =>
      route.fulfill({ json: { success: true, data: routine } })
    )
    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Press Banca')).toBeVisible()

    await page.getByRole('button', { name: /día 2/i }).click()
    await expect(page.getByText('Dominadas')).toBeVisible()
    await expect(page.queryByText('Press Banca')).not.toBeVisible()
  })
})
