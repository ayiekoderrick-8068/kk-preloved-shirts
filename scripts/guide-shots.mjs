// Takes the real screenshots used in docs/how-to-add-new-stock.md by driving the built site in demo mode
// (no database, so the "Demo mode" banner is visible). Run after `npm run build`:
//   node scripts/guide-shots.mjs docs/screenshots
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const out = process.argv[2] ?? 'docs/screenshots'
mkdirSync(out, { recursive: true })
const PORT = 4175
const base = `http://localhost:${PORT}`
const photo = (n) => path.join(process.cwd(), `public/assets/products/p-${n}.webp`)

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const stop = () => server.kill()
process.on('exit', stop)
for (let i = 0; i < 40; i++) {
  try {
    if ((await fetch(base)).ok) break
  } catch {
    await new Promise((r) => setTimeout(r, 500))
  }
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
const shot = (name, opts = {}) => page.screenshot({ path: `${out}/${name}.png`, ...opts })

await page.goto(`${base}/admin`)
await page.getByRole('navigation', { name: 'Admin' }).waitFor()
await shot('01-admin-overview')

await page.goto(`${base}/admin/products/new`)
await page.getByLabel('Product name *').fill('Sample Blue Shirt')
await page.getByLabel('Category *').selectOption('Short sleeve')
await page.getByLabel('Selling price (KES) *').fill('1500')
await page.getByLabel('Size *').fill('M')
await page.getByLabel('Colour *').fill('Blue')
await page.getByLabel('Condition *').selectOption('Very good')
await page.getByLabel('Quantity *').fill('1')
await page.getByLabel('Product description *').fill('Sample item for this guide: a soft blue short-sleeve shirt, worn lightly. Replace this with an honest description of your own item.')
await page.locator('input[type=file][aria-label="Upload photos"]').setInputFiles([photo('002'), photo('003'), photo('010')])
await page.getByRole('list', { name: 'Product photos in display order' }).locator('li').nth(2).waitFor()
// A tall viewport (not fullPage) so the sticky Publish bar sits at the bottom instead of covering a field.
await page.setViewportSize({ width: 1280, height: 1750 })
await page.evaluate(() => window.scrollTo(0, 250))
await shot('02-add-stock-form')
await page.setViewportSize({ width: 1280, height: 900 })

await page.getByRole('button', { name: 'Preview' }).click()
await page.locator('.preview').scrollIntoViewIfNeeded()
await shot('03-preview')

await page.getByRole('button', { name: 'Publish' }).click()
await page.getByText('Published.').waitFor()
await page.evaluate(() => window.scrollTo(0, 0))
await shot('04-published')

await page.goto(`${base}/admin/inventory`)
await page.getByRole('searchbox').fill('sample')
await shot('05-inventory')

await page.goto(`${base}/admin/settings`)
await shot('06-shop-settings', { fullPage: true })

await page.goto(`${base}/shop?sort=newest`)
await page.locator('.product').first().waitFor()
await shot('07-shop-new-arrival')

await page.locator('.product-name', { hasText: 'Sample Blue Shirt' }).click()
await page.getByRole('heading', { level: 1, name: 'Sample Blue Shirt' }).waitFor()
await page.waitForTimeout(800) // let every thumbnail finish decoding
await shot('08-product-page')

const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const m = await phone.newPage()
await m.goto(`${base}/shop?sort=newest`)
await m.locator('.product').first().waitFor()
await m.screenshot({ path: `${out}/09-phone-shop.png` })
await m.goto(`${base}/`)
await m.screenshot({ path: `${out}/10-phone-home.png` })

await browser.close()
stop()
console.log('screenshots saved in', out)
