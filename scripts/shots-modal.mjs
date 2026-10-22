// Dev helper: screenshots the quick view + toast on a running preview (port 4173).
import { chromium } from '@playwright/test'

const out = process.argv[2]
const browser = await chromium.launch()
for (const [name, w, h] of [
  ['modal-desktop', 1280, 800],
  ['modal-mobile', 375, 667],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.goto('http://localhost:4173/shop')
  await page.getByRole('button', { name: 'Quick view' }).first().click()
  await page.getByRole('dialog', { name: /Quick view/ }).getByRole('button', { name: /Add to bag/ }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${out}/${name}.png` })
  await page.close()
}
await browser.close()
