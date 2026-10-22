// Dev helper: screenshots the home spotlight + collage area on a running preview (port 4173).
import { chromium } from '@playwright/test'

const out = process.argv[2]
const browser = await chromium.launch()
for (const [name, w, h] of [
  ['home-1440', 1440, 900],
  ['home-768', 768, 900],
  ['home-375', 375, 800],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.goto('http://localhost:4173/')
  await page.waitForLoadState('networkidle')
  const top = await page.evaluate(() => document.querySelector('.spotlight').getBoundingClientRect().top + window.scrollY)
  const bottom = await page.evaluate(() => document.querySelector('.editorial').getBoundingClientRect().bottom + window.scrollY)
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true, clip: { x: 0, y: top - 20, width: w, height: bottom - top + 20 } })
  await page.close()
}
await browser.close()
