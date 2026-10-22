// Dev helper: lists elements wider than the viewport on a running preview (port 4173).
import { chromium } from '@playwright/test'

const browser = await chromium.launch()
for (const width of [320, 375]) {
  for (const path of ['/', '/shop', '/shop/kk-01', '/about', '/contact', '/faq']) {
    const page = await browser.newPage({ viewport: { width, height: 800 } })
    await page.goto('http://localhost:4173' + path)
    await page.waitForLoadState('networkidle')
    const bad = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      return [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > vw + 0.5)
        .slice(0, 4)
        .map((el) => `${el.tagName.toLowerCase()}.${el.className} right=${Math.round(el.getBoundingClientRect().right)}`)
    })
    if (bad.length) console.log(width, path, bad)
    await page.close()
  }
}
await browser.close()
