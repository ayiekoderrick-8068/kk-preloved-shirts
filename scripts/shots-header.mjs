// Dev helper: screenshots the header and first product cards on a running preview (port 4173).
import { chromium } from '@playwright/test'

const out = process.argv[2]
const browser = await chromium.launch()
for (const [name, w] of [
  ['hdr-1440', 1440],
  ['hdr-768', 768],
  ['hdr-375', 375],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: 700 } })
  await page.goto('http://localhost:4173/shop')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${out}/${name}.png` })
  await page.close()
}
await browser.close()
