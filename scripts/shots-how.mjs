// Dev helper: screenshots the "how it works" strip on a running preview (port 4173).
import { chromium } from '@playwright/test'

const out = process.argv[2]
const browser = await chromium.launch()
for (const [name, w] of [
  ['how-1440', 1440],
  ['how-1100', 1100],
  ['how-768', 768],
  ['how-375', 375],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: 800 } })
  await page.goto('http://localhost:4173/')
  await page.waitForLoadState('networkidle')
  const el = page.locator('.how')
  await el.screenshot({ path: `${out}/${name}.png` })
  await page.close()
}
await browser.close()
