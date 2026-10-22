// Dev helper: screenshots the top of the home page on a running preview (port 4173).
import { chromium } from '@playwright/test'

const out = process.argv[2]
const browser = await chromium.launch()
for (const [name, w, h] of [
  ['hero-1440', 1440, 760],
  ['hero-768', 768, 1100],
  ['hero-375', 375, 1000],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.goto('http://localhost:4173/')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${out}/${name}.png` })
  await page.close()
}
await browser.close()
