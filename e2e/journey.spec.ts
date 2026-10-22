import { expect, test } from '@playwright/test'

test('customer journey: browse, add to bag, validate, prepare order request', async ({ page, context }) => {
  // Never hit real WhatsApp from tests; capture the link the app opens.
  let waUrl = ''
  await context.route('https://wa.me/**', (route) => {
    waUrl = route.request().url()
    return route.fulfill({ status: 200, body: 'ok' })
  })
  await page.goto('/')
  await expect(page).toHaveTitle(/KK Pre-Loved Shirts/)

  // Rail: visible next button moves the position counter.
  await expect(page.getByText('01 / 36')).toBeVisible()
  await page.getByRole('button', { name: 'Next shirts' }).click()
  await expect(page.getByText('02 / 36')).toBeVisible()

  // Shop: search narrows results, empty state offers a reset.
  await page.getByRole('link', { name: 'Shop', exact: true }).first().click()
  await expect(page.getByText('36 shirts')).toBeVisible()
  await page.getByRole('searchbox').fill('hibiscus')
  await expect(page.getByText('1 shirt', { exact: true })).toBeVisible()
  await page.getByRole('searchbox').fill('zzzz')
  await expect(page.getByText('No shirts match those filters.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()

  // Deep-linkable product page with honest unverified details.
  await page.goto('/shop/kk-04')
  await expect(page.getByRole('heading', { level: 1, name: 'Blue Hibiscus Print Shirt' })).toBeVisible()
  await expect(page.getByText('Details to confirm').first()).toBeVisible()

  // Add to bag; a one-off cannot be added twice.
  await page.getByRole('button', { name: /Add to bag/ }).click()
  const bag = page.getByRole('dialog', { name: 'Shopping bag' })
  await expect(bag.getByText('One-off piece')).toBeVisible()
  await expect(bag.getByText('KES 350').first()).toBeVisible()
  await expect(bag.getByText(/any 2 shirts cost KES 600/i)).toBeVisible()

  // Checkout validation.
  await bag.getByRole('button', { name: 'Continue to order details' }).click()
  await expect(bag.getByText(/Booking fee: KES 200 per item/)).toBeVisible()
  await bag.getByRole('button', { name: 'Send request on WhatsApp' }).click()
  await expect(bag.getByText('Enter your full name.')).toBeVisible()
  await expect(bag.getByText('Please agree to share')).toBeVisible()

  await bag.getByLabel('Full name *').fill('Jane Wanjiku')
  await bag.getByLabel('Phone number *').fill('0712 345 678')
  await bag.getByLabel('Delivery town / estate *').fill('Kilimani, Nairobi')
  await bag.getByRole('checkbox').check()
  await bag.getByRole('button', { name: 'Send request on WhatsApp' }).click()
  await expect.poll(() => waUrl).toMatch(/^https:\/\/wa\.me\/254782718496\?text=/)

  const text = bag.getByLabel('Order request text')
  await expect(text).toHaveValue(/Blue Hibiscus Print Shirt \[KK-04\]/)
  await expect(text).toHaveValue(/Delivery fee: to confirm/)
  await expect(bag.getByText(/NOT confirmed until the shop replies/).first()).toBeVisible()

  // Escape closes and cart persists across reload.
  await page.keyboard.press('Escape')
  await page.reload()
  await expect(page.getByRole('button', { name: /Open bag, 1 item/ })).toBeVisible()
})

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    for (const path of ['/', '/shop', '/shop/kk-01', '/about', '/contact', '/faq']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0)
    }
  })
}

test('mobile menu opens and links work', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'About' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'KK Pre-Loved Shirts' })).toBeVisible()
})

test('unknown product shows not-found, admin is not indexed', async ({ page }) => {
  await page.goto('/shop/does-not-exist')
  await expect(page.getByText("That shirt isn't listed any more.")).toBeVisible()
  await page.goto('/admin')
  await expect(page.getByText('Demo mode - no database connected.')).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow')
})

