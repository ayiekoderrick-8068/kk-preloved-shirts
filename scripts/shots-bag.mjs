// Dev helper: screenshots the header bag icon in several states on a running preview (port 4173).
import { chromium } from '@playwright/test'

const out = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 400 }, deviceScaleFactor: 3 })
await page.goto('http://localhost:4173/shop')
await page.waitForLoadState('networkidle')
const clip = { x: 1080, y: 0, width: 200, height: 76 }
await page.screenshot({ path: `${out}/bag-empty.png`, clip })
await page.locator('.bag-btn').hover()
await page.screenshot({ path: `${out}/bag-hover.png`, clip })
await page.goto('http://localhost:4173/shop/kk-01')
await page.getByRole('button', { name: /Add to bag/ }).click()
await page.locator('.toast-close').click()
await page.mouse.move(10, 300)
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/bag-one.png`, clip })
await page.close()

const m = await browser.newPage({ viewport: { width: 375, height: 300 }, deviceScaleFactor: 3 })
await m.goto('http://localhost:4173/shop/kk-01')
await m.getByRole('button', { name: /Add to bag/ }).click()
await m.locator('.toast-close').click()
await m.waitForTimeout(700)
await m.screenshot({ path: `${out}/bag-mobile.png`, clip: { x: 0, y: 0, width: 375, height: 70 } })
await browser.close()
