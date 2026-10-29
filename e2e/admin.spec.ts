import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'

/*
 * Owner workflow in demo mode (no database): everything is kept in the test browser's local storage, which
 * is fresh for every test. Database-backed behaviour (RLS, sign-in) is covered by e2e/gated.spec.ts and
 * supabase/rls.check.mjs.
 */

const PHOTO = path.join(process.cwd(), 'public/assets/products/p-002.webp')
const PHOTO_2 = path.join(process.cwd(), 'public/assets/products/p-003.webp')

interface Stock {
  name: string
  price?: string
  size?: string
  color?: string
  quantity?: string
  category?: string
}

async function fillStock(page: Page, s: Stock) {
  await page.getByLabel('Product name *').fill(s.name)
  await page.getByLabel('Category *').selectOption(s.category ?? 'Long sleeve')
  await page.getByLabel('Selling price (KES) *').fill(s.price ?? '1500')
  await page.getByLabel('Size *').fill(s.size ?? 'M')
  await page.getByLabel('Colour *').fill(s.color ?? 'Navy')
  await page.getByLabel('Condition *').selectOption('Very good')
  await page.getByLabel('Quantity *').fill(s.quantity ?? '1')
  await page.getByLabel('Product description *').fill('Crisp Oxford shirt with a button-down collar, worn lightly.')
}

async function publishNewStock(page: Page, s: Stock, photos: string[] = [PHOTO]) {
  await page.goto('/admin/products/new')
  await fillStock(page, s)
  await page.locator('input[type=file][aria-label="Upload photos"]').setInputFiles(photos)
  await expect(page.getByRole('list', { name: 'Product photos in display order' }).locator('li')).toHaveCount(photos.length)
  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page.getByText('Published.')).toBeVisible()
}

test('admin has every section the owner needs', async ({ page }) => {
  await page.goto('/admin')
  const nav = page.getByRole('navigation', { name: 'Admin' })
  for (const label of ['Overview', 'Products', 'Add New Stock', 'Inventory', 'Categories', 'Orders / Inquiries', 'Shop Settings']) {
    await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible()
  }
})

test('owner publishes new stock with photos and it shows on the storefront without a deploy', async ({ page, context }) => {
  const waUrls: string[] = []
  await context.route('https://wa.me/**', (route) => {
    waUrls.push(route.request().url())
    return route.fulfill({ status: 200, body: 'ok' })
  })

  // Required fields are enforced with clear messages.
  await page.goto('/admin/products/new')
  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page.getByText(/Please fix the \d+ highlighted fields/)).toBeVisible()
  await expect(page.getByText('Enter the size.')).toBeVisible()
  await expect(page.getByText('Add at least one real photo.')).toBeVisible()

  await publishNewStock(page, { name: 'Navy Oxford Shirt', size: 'M', price: '1500' }, [PHOTO, PHOTO_2])
  await expect(page.getByText(/listed under New Arrivals/)).toBeVisible()

  // Uploaded photos keep their proportions (resized, never stretched).
  const ratios = await page.evaluate(async (src) => {
    const load = (url: string) => new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.src = url })
    const orig = await load(src)
    const thumb = document.querySelector<HTMLImageElement>('.photo img')!
    return { orig: orig.naturalWidth / orig.naturalHeight, up: thumb.naturalWidth / thumb.naturalHeight, w: thumb.naturalWidth }
  }, '/assets/products/p-002.webp')
  expect(Math.abs(ratios.up - ratios.orig) / ratios.orig).toBeLessThan(0.01)
  expect(ratios.w).toBeGreaterThan(300)

  // Home page: New arrivals section with the badge.
  await page.goto('/')
  const arrivals = page.locator('.new-arrivals')
  await expect(arrivals.getByRole('heading', { name: 'New arrivals' })).toBeVisible()
  const card = arrivals.locator('.product', { hasText: 'Navy Oxford Shirt' })
  await expect(card).toHaveCount(1)
  await expect(card.getByText('New arrival')).toBeVisible()
  await expect(card.getByText('Size M · Very good')).toBeVisible()
  await expect(card.getByText('KES 1,500')).toBeVisible()

  // Searchable and filterable in the shop, and the detail page works.
  await page.goto('/shop?sort=newest')
  await expect(page.locator('.product').first()).toContainText('Navy Oxford Shirt') // newest first
  await page.getByRole('searchbox').fill('navy')
  await expect(page.getByText('1 item', { exact: true })).toBeVisible()
  await page.getByLabel('Category').selectOption('Long sleeve')
  await expect(page.getByText('1 item', { exact: true })).toBeVisible()
  await page.locator('.product-name', { hasText: 'Navy Oxford Shirt' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Navy Oxford Shirt' })).toBeVisible()
  const productUrl = page.url()
  await expect(page.getByText('KES 1,500').first()).toBeVisible()
  await expect(page.getByText('Colour')).toBeVisible()
  await expect(page.getByText('One piece available')).toBeVisible()

  // WhatsApp inquiry is built from the real product data and does not change stock.
  const ask = page.getByRole('link', { name: /Ask on WhatsApp/ })
  const href = (await ask.getAttribute('href')) ?? ''
  const text = decodeURIComponent(href.split('?text=')[1])
  expect(text).toContain("I'm interested in Navy Oxford Shirt, size M, priced at KES 1,500. Is it still available?")
  expect(text).toContain('SKU: KK-37')
  expect(text).toContain('/shop/')
  const [popup] = await Promise.all([context.waitForEvent('page'), ask.click()])
  await popup.close()
  expect(waUrls.length).toBeGreaterThan(0)
  await page.reload()
  await expect(page.getByText('One piece available')).toBeVisible() // still available: opening WhatsApp never marks it sold

  // Persists across a reload (and shows in the inquiries log).
  await page.goto(productUrl)
  await expect(page.getByRole('heading', { level: 1, name: 'Navy Oxford Shirt' })).toBeVisible()
  await page.goto('/admin/inquiries')
  await expect(page.getByRole('row', { name: /Navy Oxford Shirt/ })).toBeVisible()
})

test('product page zoom works and images are not distorted', async ({ page }) => {
  await page.goto('/shop/kk-01')
  const zoom = page.getByRole('button', { name: /Zoom in on/ })
  await expect(zoom).toHaveAttribute('aria-pressed', 'false')
  await zoom.click()
  await expect(page.getByRole('button', { name: /Zoom out of/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.zoom-inner')).toHaveCSS('transform', /matrix\(2\.2/)
  const fit = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLImageElement>('.zoom img, .thumbs img')].map((i) => ({ fit: getComputedStyle(i).objectFit, ok: i.complete && i.naturalWidth > 0 })),
  )
  expect(fit.length).toBeGreaterThan(1)
  for (const f of fit) {
    expect(['contain', 'cover']).toContain(f.fit)
    expect(f.ok).toBe(true)
  }
  await page.goto('/shop')
  const cards = await page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>('.product-visual img')].slice(0, 8).map((i) => getComputedStyle(i).objectFit))
  for (const f of cards) expect(f).toBe('cover')
})

test('drafts need only a name, stay hidden from customers, and can be published later', async ({ page }) => {
  await page.goto('/admin/products/new')
  await page.getByLabel('Product name *').fill('Half-finished Hoodie')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByText('Draft saved.')).toBeVisible()

  await page.goto('/shop')
  await page.getByRole('searchbox').fill('Hoodie')
  await expect(page.getByText('No items match those filters.')).toBeVisible()

  await page.goto('/admin/inventory')
  await page.getByRole('searchbox').fill('Half-finished')
  await expect(page.getByLabel('Status for Half-finished Hoodie')).toHaveValue('draft')

  await page.getByRole('link', { name: 'Edit' }).click()
  await fillStock(page, { name: 'Half-finished Hoodie' })
  await page.locator('input[type=file][aria-label="Upload photos"]').setInputFiles(PHOTO)
  await expect(page.locator('.photo')).toHaveCount(1)
  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page.getByText('Published.')).toBeVisible()
  await page.goto('/shop')
  await page.getByRole('searchbox').fill('Hoodie')
  await expect(page.getByText('1 item', { exact: true })).toBeVisible()
})

test('photos can be made main, reordered and removed', async ({ page }) => {
  await page.goto('/admin/products/new')
  await page.locator('input[type=file][aria-label="Upload photos"]').setInputFiles([PHOTO, PHOTO_2])
  const photos = page.locator('.photo')
  await expect(photos).toHaveCount(2)
  await expect(photos.first().getByText('Main')).toBeVisible()
  const first = await photos.nth(0).locator('img').getAttribute('src')
  const second = await photos.nth(1).locator('img').getAttribute('src')
  await page.getByRole('button', { name: 'Make photo 2 the main photo' }).click()
  await expect(photos.nth(0).locator('img')).toHaveAttribute('src', second!)
  await page.getByRole('button', { name: 'Move photo 1 later' }).click()
  await expect(photos.nth(0).locator('img')).toHaveAttribute('src', first!)
  await page.getByRole('button', { name: 'Remove photo 2' }).click()
  await expect(photos).toHaveCount(1)
})

test('owner edits price, quantity and status; customers see the changes', async ({ page }) => {
  await page.goto('/admin/inventory')
  await page.getByRole('searchbox').fill('Hibiscus')
  const price = page.getByLabel(/Price for Blue Hibiscus Print Shirt/)
  await price.fill('1800')
  await price.blur()
  await expect(page.getByText('Blue Hibiscus Print Shirt: price updated.')).toBeVisible()
  const qty = page.getByLabel('Quantity for Blue Hibiscus Print Shirt')
  await qty.fill('2')
  await qty.blur()
  await expect(page.getByText('Blue Hibiscus Print Shirt: quantity updated.')).toBeVisible()

  await page.goto('/shop/kk-04')
  await expect(page.getByText('KES 1,800').first()).toBeVisible()
  await expect(page.getByText('2 available').first()).toBeVisible()

  // Negative quantities are refused.
  await page.goto('/admin/inventory')
  await page.getByRole('searchbox').fill('Hibiscus')
  const q2 = page.getByLabel('Quantity for Blue Hibiscus Print Shirt')
  await q2.fill('-3')
  await q2.blur()
  await expect(page.getByRole('alert').filter({ hasText: 'cannot be negative' })).toBeVisible()

  // Reserved: visible but cannot be bagged.
  await page.getByLabel('Status for Blue Hibiscus Print Shirt').selectOption('reserved')
  await page.goto('/shop/kk-04')
  await expect(page.getByRole('button', { name: 'Reserved', exact: true })).toBeDisabled()

  // Sold out.
  await page.goto('/admin/inventory')
  await page.getByRole('searchbox').fill('Hibiscus')
  await page.getByRole('button', { name: 'Mark sold out' }).click()
  await page.goto('/shop/kk-04')
  await expect(page.getByRole('button', { name: 'Sold out' })).toBeDisabled()
  await page.goto('/shop')
  await page.getByRole('searchbox').fill('Hibiscus')
  await expect(page.locator('.product', { hasText: 'Blue Hibiscus' }).getByText('Sold out').first()).toBeVisible()

  // Archived items leave the shop entirely.
  await page.goto('/admin/inventory')
  await page.getByRole('searchbox').fill('Hibiscus')
  await page.getByRole('button', { name: 'Archive' }).click()
  await page.goto('/shop/kk-04')
  await expect(page.getByText("That item isn't listed any more.")).toBeVisible()
})

test('deleting a product asks for confirmation first', async ({ page }) => {
  await publishNewStock(page, { name: 'Throwaway Tee' })
  await page.goto('/admin/inventory')
  await page.getByRole('searchbox').fill('Throwaway')
  await page.getByRole('button', { name: 'Delete' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('Delete “Throwaway Tee”?')
  await dialog.getByRole('button', { name: 'Keep it' }).click()
  await expect(page.getByLabel('Status for Throwaway Tee')).toBeVisible()
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Yes, delete it' }).click()
  await expect(page.getByLabel('Status for Throwaway Tee')).toHaveCount(0)
})

test('categories: add one, use it for stock and as a shop filter; a used category cannot be deleted', async ({ page }) => {
  await page.goto('/admin/categories')
  await page.getByLabel('New category').fill('Trousers')
  await page.getByRole('button', { name: 'Add category' }).click()
  await expect(page.getByRole('row', { name: /Trousers/ })).toBeVisible()
  await page.getByLabel('New category').fill('trousers')
  await page.getByRole('button', { name: 'Add category' }).click()
  await expect(page.getByText('That category already exists.')).toBeVisible()

  await publishNewStock(page, { name: 'Chino Trousers', category: 'Trousers', size: '32' })
  await page.goto('/shop')
  await page.getByLabel('Category').selectOption('Trousers')
  await expect(page.getByText('1 item', { exact: true })).toBeVisible()

  await page.goto('/admin/categories')
  await expect(page.getByRole('row', { name: /Trousers/ }).getByRole('button', { name: 'Delete' })).toBeDisabled()
})

test('shop settings: validated, saved, and shown across the public site', async ({ page }) => {
  await page.goto('/admin/settings')
  await expect(page.getByLabel('Shop name *')).toBeVisible()

  // Invalid links are rejected before saving.
  await page.getByLabel('Instagram link').fill('instagram.com/not-a-link')
  await page.getByLabel('TikTok link').fill('https://example.com/@x')
  await page.getByLabel('WhatsApp Business number or link').fill('12')
  await page.getByRole('button', { name: 'Save settings' }).click()
  await expect(page.getByText(/full Instagram link/)).toBeVisible()
  await expect(page.getByText(/full TikTok link/)).toBeVisible()
  await expect(page.getByText(/Enter a WhatsApp number/)).toBeVisible()

  await page.getByLabel('Shop name *').fill('Test Thrift Shop')
  await page.getByLabel('Shop slogan').fill('Test slogan only')
  await page.getByLabel('Instagram link').fill('https://www.instagram.com/test.shop')
  await page.getByLabel('TikTok link').fill('https://www.tiktok.com/@test.shop')
  await page.getByLabel('WhatsApp Business number or link').fill('https://wa.me/254700111222')
  await page.getByLabel('Store announcement').fill('Test announcement')
  await page.getByRole('button', { name: 'Save settings' }).click()
  await expect(page.getByText('Saved. The changes are now showing on the shop.')).toBeVisible()

  for (const url of ['/', '/contact']) {
    await page.goto(url)
    await expect(page.getByRole('region', { name: 'Store announcement' })).toContainText('Test announcement')
    const footer = page.locator('footer')
    await expect(footer).toContainText('TEST THRIFT SHOP')
    await expect(footer).toContainText('Test slogan only')
    await expect(footer.getByRole('link', { name: /Instagram/ })).toHaveAttribute('href', 'https://www.instagram.com/test.shop')
    await expect(footer.getByRole('link', { name: /TikTok/ })).toHaveAttribute('href', 'https://www.tiktok.com/@test.shop')
    await expect(footer.getByRole('link', { name: /Chat on WhatsApp/ })).toHaveAttribute('href', /^https:\/\/wa\.me\/254700111222/)
    await expect(page.getByRole('link', { name: /Chat with us on WhatsApp/ })).toHaveAttribute('href', /^https:\/\/wa\.me\/254700111222/)
  }
  // The displayed phone number is replaced by buttons (no raw WhatsApp number in the footer).
  await expect(page.locator('footer')).not.toContainText('254700111222')
  await expect(page.locator('footer')).not.toContainText('0782 718 496')

  // Persists after reload, and the product inquiry uses the new number and shop name.
  await page.goto('/shop/kk-01')
  const href = (await page.getByRole('link', { name: /Ask on WhatsApp/ }).getAttribute('href')) ?? ''
  expect(href).toMatch(/^https:\/\/wa\.me\/254700111222\?text=/)
  expect(decodeURIComponent(href)).toContain('Hello Test Thrift Shop!')
  await page.goto('/admin/settings')
  await expect(page.getByLabel('Shop slogan')).toHaveValue('Test slogan only')
})

test('slogan, TikTok and announcement stay empty until the owner sets them', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Store announcement' })).toHaveCount(0)
  await expect(page.locator('.logo-slogan')).toHaveCount(0)
  await expect(page.locator('footer').getByRole('link', { name: /TikTok|Instagram/ })).toHaveCount(0)
  // WhatsApp still works with the shop's original number.
  await expect(page.getByRole('link', { name: /Chat with us on WhatsApp/ })).toHaveAttribute('href', /^https:\/\/wa\.me\/2547/)
})

for (const vp of [
  { name: 'mobile', width: 375, height: 700 },
  { name: 'desktop', width: 1280, height: 800 },
]) {
  test(`logo displays correctly on ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')
    const logo = page.locator('.logo img')
    await expect(logo).toBeVisible()
    const info = await logo.evaluate((el: HTMLImageElement) => ({ ok: el.complete && el.naturalWidth > 0, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height }))
    expect(info.ok).toBe(true)
    expect(Math.abs(info.w - info.h)).toBeLessThan(1) // square, not squashed
    expect(info.w).toBeGreaterThanOrEqual(40)
    await expect(page.locator('footer img').first()).toBeVisible()
    await expect(page.locator('link[rel=icon]')).toHaveAttribute('href', '/logo.png')
  })
}

for (const width of [375, 768, 1280]) {
  test(`admin pages have no horizontal page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    for (const p of ['/admin', '/admin/products', '/admin/products/new', '/admin/inventory', '/admin/categories', '/admin/inquiries', '/admin/settings']) {
      await page.goto(p)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `${p} at ${width}px`).toBeLessThanOrEqual(0)
    }
  })
}
