import { test, expect } from '@playwright/test'
import { loginAsMember } from '../utils/playwright-fixtures'

const GYM_ID = '1'
const HISTORY_URL = `/gym/${GYM_ID}/member/history`

test.describe('Member — history navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMember(page)
    await page.goto(HISTORY_URL)
    await page.waitForLoadState('networkidle')
  })

  test('shows assignment list with active and past tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /activa/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /pasadas/i })).toBeVisible()
    await expect(page.getByText('Hipertrofia Vol. A')).toBeVisible()
  })

  test('clicking past tab shows past assignments', async ({ page }) => {
    await page.getByRole('button', { name: /pasadas/i }).click()
    await expect(page.getByText('Fuerza 5x5')).toBeVisible()
  })

  test('clicking an assignment navigates to detail page', async ({ page }) => {
    await page.getByText('Hipertrofia Vol. A').click()
    await expect(page).toHaveURL(new RegExp(`${HISTORY_URL}/\\d+`), { timeout: 8_000 })
    await expect(page.getByRole('heading', { name: /hipertrofia vol\. a/i })).toBeVisible()
  })

  test('assignment detail shows blocks and exercises', async ({ page }) => {
    await page.getByText('Hipertrofia Vol. A').click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Push')).toBeVisible()
    await expect(page.getByText('Press Banca')).toBeVisible()
    await expect(page.getByText(/día 1/i)).toBeVisible()
  })

  test('clicking exercise navigates to progress chart', async ({ page }) => {
    await page.getByText('Hipertrofia Vol. A').click()
    await page.waitForLoadState('networkidle')

    await page.getByText('Press Banca').click()
    await expect(page).toHaveURL(/\/exercises\/\d+/, { timeout: 8_000 })
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /press banca/i })).toBeVisible()
    // Chart should be rendered
    await expect(page.locator('svg')).toBeVisible()
  })
})
