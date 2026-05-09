import { test, expect } from '@playwright/test'

const LOGIN_API = 'http://localhost:4001/api/public/auth/login'

test.describe('Auth — login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('shows login form with email and Google options', async ({ page }) => {
    await expect(page.getByLabel(/email o usuario/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible()
  })

  test('successful login redirects to /select-gym', async ({ page }) => {
    // The mock API server handles valid credentials
    await page.getByLabel(/email o usuario/i).fill('valid@test.com')
    await page.getByLabel(/contraseña/i).fill('password123')
    await page.getByRole('button', { name: /ingresar/i }).click()

    await expect(page).toHaveURL(/\/select-gym/, { timeout: 10_000 })
  })

  test('invalid credentials shows error message', async ({ page }) => {
    // Override with error response
    await page.route(LOGIN_API, route =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email o contraseña incorrectos' }),
      })
    )

    await page.getByLabel(/email o usuario/i).fill('bad@example.com')
    await page.getByLabel(/contraseña/i).fill('wrongpass')
    await page.getByRole('button', { name: /ingresar/i }).click()

    await expect(page.getByText(/email o contraseña incorrectos/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('Google account message shown for OAuth-only account', async ({ page }) => {
    await page.route(LOGIN_API, route =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Esta cuenta usa Google para ingresar' }),
      })
    )

    await page.getByLabel(/email o usuario/i).fill('google@test.com')
    await page.getByLabel(/contraseña/i).fill('anything')
    await page.getByRole('button', { name: /ingresar/i }).click()

    await expect(page.getByText(/usá el botón de google/i)).toBeVisible()
  })

  test('logout clears cookie and redirects to /login', async ({ page }) => {
    // Set up authenticated state
    await page.context().addCookies([
      { name: 'sgg-token', value: 'fake-token', domain: 'localhost', path: '/' },
    ])
    await page.goto('/select-gym')

    // Find and click logout button
    const logoutBtn = page.getByRole('button', { name: /salir|cerrar sesión|logout/i })
    await expect(logoutBtn).toBeVisible({ timeout: 5_000 })
    await logoutBtn.click()

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
