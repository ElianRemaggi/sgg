const { chromium } = require('playwright')
const path = require('path')

const ADMIN_COACH_TOKEN = process.argv[2]
const MEMBER_TOKEN = process.argv[3]
const GYM_ID = 1
const BASE_URL = 'http://localhost:3000'
const OUT_DIR = path.join(__dirname, '../public/screenshots')

async function makeContext(browser, token) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  })
  await ctx.addCookies([{
    name: 'sgg-token',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
  }])
  return ctx
}

async function screenshot(page, name, url, { waitFor, beforeShot } = {}) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle' })
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 8000 }).catch(() => {})
  if (beforeShot) await beforeShot(page)
  await page.waitForTimeout(600)
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.jpg`),
    type: 'jpeg',
    quality: 92,
    fullPage: false,
  })
  console.log(`✓ ${name}.jpg`)
}

;(async () => {
  const browser = await chromium.launch()

  // ── Admin / Coach context ─────────────────────────────────────────────────
  const adminCtx = await makeContext(browser, ADMIN_COACH_TOKEN)
  const adminPage = await adminCtx.newPage()

  // 1. Admin — lista de miembros
  await screenshot(adminPage, 'admin-members', `/gym/${GYM_ID}/admin/members`, {
    waitFor: 'table tbody tr',
  })

  // 2. Admin — horarios
  await screenshot(adminPage, 'admin-schedule', `/gym/${GYM_ID}/admin/schedule`, {
    waitFor: 'h1, [class*="schedule"], [class*="calendar"]',
  })

  // 3. Coach — plantillas de rutinas
  await screenshot(adminPage, 'coach-templates', `/gym/${GYM_ID}/coach/templates`, {
    waitFor: '[class*="card"], h1',
  })

  // 4. Coach — asignar rutina
  await screenshot(adminPage, 'coach-assign', `/gym/${GYM_ID}/coach/assign`, {
    waitFor: 'h1, [class*="assign"], form',
  })

  await adminCtx.close()

  // ── Member context ────────────────────────────────────────────────────────
  const memberCtx = await makeContext(browser, MEMBER_TOKEN)
  const memberPage = await memberCtx.newPage()

  // 5. Member — rutina activa
  await screenshot(memberPage, 'member-routine', `/gym/${GYM_ID}/member/routine`, {
    waitFor: '[class*="block"], [class*="exercise"], h1',
  })

  // 6. Member — historial con datos
  await screenshot(memberPage, 'member-history', `/gym/${GYM_ID}/member/history`, {
    waitFor: '[class*="card"], h1',
  })

  await memberCtx.close()
  await browser.close()
  console.log('\nDone. Screenshots saved to public/screenshots/')
})()
