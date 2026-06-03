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
    // Expand first exercise (button contains ChevronDown icon)
    const expandBtn = page.locator('button').filter({ has: page.locator('.lucide-chevron-down') }).first()
    await expandBtn.click()

    // Fill weight and click complete
    await page.getByPlaceholder(/ej: 60/i).fill('80')
    await page.getByRole('button', { name: /completar/i }).click()

    // Server action succeeds → success toast is shown
    await expect(page.getByText(/ejercicio completado/i)).toBeVisible({ timeout: 5_000 })
  })

  test('switching day tab shows different block', async ({ page }) => {
    // Global mock returns 2 blocks: Push (day 1) and Pull (day 2)
    await expect(page.getByText('Press Banca')).toBeVisible()

    await page.getByRole('button', { name: /día 2/i }).click()
    await expect(page.getByText('Dominadas')).toBeVisible()
    await expect(page.getByText('Press Banca')).not.toBeVisible()
  })
})
