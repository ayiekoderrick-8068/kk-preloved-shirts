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
  await expect(page.getByText('36 items')).toBeVisible()
  await page.getByRole('searchbox').fill('hibiscus')
  await expect(page.getByText('1 item', { exact: true })).toBeVisible()
  await page.getByRole('searchbox').fill('zzzz')
  await expect(page.getByText('No items match those filters.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()

  // Deep-linkable product page with honest unverified details.
  await page.goto('/shop/kk-04')
  await expect(page.getByRole('heading', { level: 1, name: 'Blue Hibiscus Print Shirt' })).toBeVisible()
  await expect(page.getByText('Details to confirm').first()).toBeVisible()

  // Add to bag; a one-off cannot be added twice.
  await page.getByRole('button', { name: /Add to bag/ }).click()
  // The bag does not open by itself: a corner toast confirms and offers "View bag".
  await expect(page.getByRole('dialog', { name: 'Shopping bag' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Added to bag' })).toBeDisabled()
  await page.locator('.toast').getByRole('button', { name: 'View bag' }).click()
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

for (const vp of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 560 },
]) {
  test(`quick view stays clean after adding to bag (${vp.name})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/shop')
    await page.getByRole('button', { name: 'Quick view' }).first().click()
    const modal = page.getByRole('dialog', { name: /Quick view/ })
    await expect(modal).toBeVisible()

    // Modal scrolls inside its own max-height instead of overflowing the viewport.
    const box = await modal.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { overflowY: cs.overflowY, height: el.getBoundingClientRect().height, vh: window.innerHeight }
    })
    expect(box.overflowY).toBe('auto')
    expect(box.height).toBeLessThanOrEqual(box.vh)

    await modal.getByRole('button', { name: /Add to bag/ }).click()

    // No full-width "in your bag" bar inside the modal; the button just settles into a disabled "Added" state.
    await expect(modal.getByText(/view bag/i)).toHaveCount(0)
    await expect(modal.getByRole('button', { name: 'Added to bag' })).toBeDisabled()

    // Toast: inside the viewport, in a corner, and above the modal in stacking order.
    const toast = page.locator('.toast')
    await expect(toast).toContainText('Added to bag')
    const t = await toast.boundingBox()
    expect(t).not.toBeNull()
    expect(t!.x + t!.width).toBeLessThanOrEqual(vp.width)
    expect(t!.y + t!.height).toBeLessThanOrEqual(vp.height)
    expect(t!.y).toBeGreaterThan(vp.height / 2) // bottom corner
    const onTop = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.toast') !== null, {
      x: t!.x + t!.width / 2,
      y: t!.y + t!.height / 2,
    })
    expect(onTop).toBe(true)

    // "View bag" swaps the quick view for the bag drawer rather than stacking both.
    await toast.getByRole('button', { name: 'View bag' }).click()
    await expect(page.getByRole('dialog', { name: 'Shopping bag' })).toBeVisible()
    await expect(page.getByRole('dialog', { name: /Quick view/ })).toBeHidden()
  })
}

for (const width of [375, 768, 1024, 1440]) {
  test(`home page: no repeated shirts and a clean collage at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.spotlight .product')).toHaveCount(4)

    const spotlight = await page.locator('.spotlight .product-name').allTextContents()
    const collage = await page.locator('.collage img').evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).alt))
    expect(collage).toEqual(['Beige Half-Zip Shirt', 'Dusty Pink Short-Sleeve Shirt', 'White Textured Short-Sleeve Shirt'])
    expect(new Set([...spotlight, ...collage]).size).toBe(spotlight.length + collage.length)

    await page.locator('.editorial').scrollIntoViewIfNeeded()
    const info = await page.evaluate(() => {
      const wrap = document.querySelector('.collage')!.getBoundingClientRect()
      const imgs = [...document.querySelectorAll<HTMLElement>('.collage img')]
      const inside = imgs.every((i) => {
        const r = i.getBoundingClientRect()
        return r.left >= wrap.left - 20 && r.right <= wrap.right + 20 && r.top >= wrap.top - 20 && r.bottom <= wrap.bottom + 20
      })
      const front = imgs[2].getBoundingClientRect()
      const topAtCenter = document.elementFromPoint(front.left + front.width / 2, front.top + front.height / 2)
      return { inside, whiteInFront: topAtCenter === imgs[2] }
    })
    expect(info.inside).toBe(true)
    expect(info.whiteInFront).toBe(true)

    // Spotlight cards line up: same photo height and same Quick view baseline within each row.
    const rows = await page.locator('.spotlight .product').evaluateAll((cards) =>
      cards.map((c) => ({
        photo: Math.round(c.querySelector('.product-visual')!.getBoundingClientRect().height),
        quickTop: Math.round(c.querySelector('.quick-btn')!.getBoundingClientRect().top - c.getBoundingClientRect().top),
        rowTop: Math.round(c.getBoundingClientRect().top),
      })),
    )
    expect(new Set(rows.map((r) => r.photo)).size).toBe(1)
    for (const top of new Set(rows.map((r) => r.rowTop))) {
      expect(new Set(rows.filter((r) => r.rowTop === top).map((r) => r.quickTop)).size).toBe(1)
    }
  })
}

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`header layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/shop')
    const m = await page.evaluate(() => {
      const r = (sel: string) => document.querySelector(sel)?.getBoundingClientRect()
      const header = r('.nav-inner')!
      const logo = r('.logo')!
      const nav = r('.nav-links')
      const bag = r('.bag-btn')!
      const toggle = r('.nav-toggle')
      const navVisible = !!nav && nav.width > 0
      const cy = (b: DOMRect) => b.top + b.height / 2
      return {
        navVisible,
        logoLeft: logo.left,
        logoRight: logo.right,
        navLeft: nav?.left ?? 0,
        navRight: nav?.right ?? 0,
        navCenter: nav ? nav.left + nav.width / 2 : 0,
        bagLeft: bag.left,
        bagRight: bag.right,
        toggleRight: toggle?.right ?? 0,
        mid: cy(header),
        dy: [cy(logo), nav && nav.width > 0 ? cy(nav) : cy(logo), cy(bag)].map((y) => Math.abs(y - cy(header))),
        vw: document.documentElement.clientWidth,
        scrollW: document.documentElement.scrollWidth,
      }
    })
    expect(m.scrollW).toBeLessThanOrEqual(m.vw)
    expect(m.logoLeft).toBeLessThan(m.vw * 0.1) // far left
    expect(m.bagRight).toBeLessThanOrEqual(m.vw)
    for (const d of m.dy) expect(d).toBeLessThan(4) // vertically centred
    if (width > 760) {
      expect(m.navVisible).toBe(true)
      expect(m.logoRight).toBeLessThanOrEqual(m.navLeft) // no overlap
      expect(m.navRight).toBeLessThanOrEqual(m.bagLeft)
      expect(Math.abs(m.navCenter - m.vw / 2)).toBeLessThan(8) // links centred
      await expect(page.locator('.nav-links a.active')).toHaveText('Shop')
      const underline = await page.locator('.nav-links a.active').evaluate((el) => getComputedStyle(el).borderBottomColor)
      expect(underline).toBe('rgb(162, 77, 53)') // terracotta #a24d35
    } else {
      expect(m.navVisible).toBe(false)
      expect(m.logoRight).toBeLessThanOrEqual(m.bagLeft)
      expect(m.toggleRight).toBeLessThanOrEqual(m.vw)
    }
  })
}

test('bag counter updates when products are added and removed', async ({ page }) => {
  await page.goto('/shop/kk-01')
  const count = page.locator('.bag-btn .bag-count')
  const bagButton = page.locator('.bag-btn')
  // Empty bag: icon only, no badge.
  await expect(count).toHaveCount(0)
  await expect(bagButton).toHaveAccessibleName('Open bag, empty')
  await page.getByRole('button', { name: /Add to bag/ }).click()
  await expect(count).toHaveText('1')
  await expect(bagButton).toHaveAccessibleName('Open bag, 1 item')
  await expect(page.locator('.bag-art.bump')).toHaveCount(1) // add animation played
  const badge = await count.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(badge).toBe('rgb(162, 77, 53)') // terracotta
  // Layout size (unaffected by the bounce transform) stays within the 28-32px spec.
  const size = await page.locator('.bag-svg').evaluate((el) => (el as unknown as SVGElement & { width: SVGAnimatedLength }).width.baseVal.value)
  expect(size).toBeGreaterThanOrEqual(28)
  expect(size).toBeLessThanOrEqual(32)
  await page.locator('.toast').getByRole('button', { name: 'View bag' }).click()
  await page.getByRole('dialog', { name: 'Shopping bag' }).getByRole('button', { name: 'Remove' }).click()
  await expect(count).toHaveCount(0)
})

test('bag icon is keyboard accessible and opens the bag', async ({ page }) => {
  await page.goto('/shop')
  await page.locator('.bag-btn').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Shopping bag' })).toBeVisible()
})

test('product cards: "Check availability" opens a WhatsApp chat about that exact shirt', async ({ page, context }) => {
  let waUrl = ''
  await context.route('https://wa.me/**', (route) => {
    waUrl = route.request().url()
    return route.fulfill({ status: 200, body: 'ok' })
  })
  await page.goto('/shop')
  await expect(page.locator('.stock')).toHaveCount(0) // beige badges are gone from cards
  const card = page.locator('.product').first()
  const link = card.getByRole('link', { name: /Check availability/ })
  await expect(link).toHaveText('Check availability →')
  const href = (await link.getAttribute('href')) ?? ''
  expect(href).toMatch(/^https:\/\/wa\.me\/254782718496\?text=/)
  const text = decodeURIComponent(href.split('?text=')[1])
  expect(text).toContain("I'm interested in Butterfly Print Camp Shirt")
  expect(text).toContain('SKU: KK-01')
  expect(text).toContain('/shop/kk-01')
  await expect(card.getByRole('button', { name: 'Quick view' })).toBeVisible()
  const [popup] = await Promise.all([context.waitForEvent('page'), link.click()])
  await popup.close()
  expect(waUrl).toContain('wa.me/254782718496')
})

test('mobile menu opens and links work', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'About' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'KK Pre-Loved Shirts' })).toBeVisible()
})

test('unknown product shows not-found, admin is not indexed', async ({ page }) => {
  await page.goto('/shop/does-not-exist')
  await expect(page.getByText("That item isn't listed any more.")).toBeVisible()
  await page.goto('/admin')
  await expect(page.getByText('Demo mode - no database connected.')).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow')
})

