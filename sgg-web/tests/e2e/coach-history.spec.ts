import { test, expect } from '@playwright/test'
import { loginAsCoach } from '../utils/playwright-fixtures'

const GYM_ID = '1'
const MEMBER_ID = '5'
const HISTORY_URL = `/gym/${GYM_ID}/coach/history/${MEMBER_ID}`

test.describe('Coach — member history', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCoach(page)

    // Mock coach history endpoints (server-side)
    await page.goto(HISTORY_URL)
    await page.waitForLoadState('networkidle')
  })

  test('shows assignment list for the member', async ({ page }) => {
    await expect(page.getByRole('button', { name: /activa/i })).toBeVisible()
    await expect(page.getByText('Hipertrofia Vol. A')).toBeVisible()
  })

  test('past tab shows past assignments', async ({ page }) => {
    await page.getByRole('button', { name: /pasadas/i }).click()
    await expect(page.getByText('Fuerza 5x5')).toBeVisible()
  })

  test('clicking assignment navigates to coach assignment detail', async ({ page }) => {
    await page.getByText('Hipertrofia Vol. A').click()
    await expect(page).toHaveURL(
      new RegExp(`${HISTORY_URL}/\\d+`),
      { timeout: 8_000 }
    )
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /hipertrofia vol\. a/i })).toBeVisible()
  })

  test('assignment detail shows blocks, exercises and stats', async ({ page }) => {
    await page.getByText('Hipertrofia Vol. A').click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Push')).toBeVisible()
    await expect(page.getByText('Press Banca')).toBeVisible()
    // Stats cards
    await expect(page.getByText(/días entrenados/i)).toBeVisible()
    await expect(page.getByText(/completions/i)).toBeVisible()
  })

  test('exercise progress chart is visible in coach view', async ({ page }) => {
    await page.getByText('Hipertrofia Vol. A').click()
    await page.waitForLoadState('networkidle')
    await page.getByText('Press Banca').click()
    await expect(page).toHaveURL(/\/exercises\/\d+/, { timeout: 8_000 })
    await page.waitForLoadState('networkidle')

    await expect(page.locator('svg.w-full')).toBeVisible()
    await expect(page.getByText(/mejor peso/i)).toBeVisible()
  })
})
