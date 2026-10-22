// Dev helper: screenshots key pages from a running preview server (npm run preview -- --port 4173).
import { chromium } from '@playwright/test'

const out = process.argv[2]
const browser = await chromium.launch()
for (const [name, w, h, path] of [
  ['home-desktop', 1440, 900, '/'],
  ['shop-desktop', 1440, 900, '/shop'],
  ['product-desktop', 1440, 900, '/shop/kk-04'],
  ['home-mobile', 375, 800, '/'],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.goto('http://localhost:4173' + path)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${out}/${name}.png` })
  await page.close()
}
await browser.close()
