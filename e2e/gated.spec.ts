import { expect, test, type Page, type Route } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'

/*
 * Runs against a build wired to a (mocked) Supabase project, to check the admin gate in the UI:
 * signed-out visitors and signed-in non-admins never see stock management, and nothing is written.
 * The database-side protection (Row Level Security) is verified separately by supabase/rls.check.mjs.
 */

const SUPA = 'http://127.0.0.1:54321'
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')

function session() {
  const exp = Math.floor(Date.now() / 1000) + 3600
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'user-1', role: 'authenticated', exp })}.sig`
  return JSON.stringify({ access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'r', user: { id: 'user-1', email: 'someone@example.com', aud: 'authenticated' } })
}

interface Mode {
  signedIn: boolean
  admin: boolean
}

async function mockSupabase(page: Page, mode: Mode) {
  const writes: string[] = []
  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) })
  await page.route(`${SUPA}/**`, (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
    }
    const { pathname } = new URL(req.url())
    if (req.method() !== 'GET') writes.push(`${req.method()} ${pathname}`)
    if (pathname === '/auth/v1/user') return mode.signedIn ? json(route, 200, { id: 'user-1', email: 'someone@example.com', aud: 'authenticated' }) : json(route, 401, { code: 401, msg: 'invalid JWT' })
    if (pathname === '/rest/v1/admins') return json(route, 200, mode.admin ? [{ user_id: 'user-1' }] : [])
    if (pathname === '/rest/v1/categories') return json(route, 200, [{ id: 'c1', name: 'Short sleeve', sort_order: 1 }])
    return json(route, 200, [])
  })
  if (mode.signedIn) await page.addInitScript((s) => localStorage.setItem('sb-127-auth-token', s), session())
  return writes
}

test('signed-out visitors only get the sign-in form, on every admin route', async ({ page }) => {
  const writes = await mockSupabase(page, { signedIn: false, admin: false })
  for (const path of ['/admin', '/admin/products/new', '/admin/inventory', '/admin/categories', '/admin/settings', '/admin/inquiries']) {
    await page.goto(path)
    await expect(page.getByRole('form', { name: 'Admin sign in' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Admin' })).toHaveCount(0)
    await expect(page.getByLabel('Product name *')).toHaveCount(0)
    await expect(page.getByLabel('Shop name *')).toHaveCount(0)
  }
  expect(writes).toEqual([])
})

test('a signed-in user who is not in the admins table is refused', async ({ page }) => {
  const writes = await mockSupabase(page, { signedIn: true, admin: false })
  await page.goto('/admin/products/new')
  await expect(page.getByRole('alert')).toContainText('not an admin')
  await expect(page.getByRole('navigation', { name: 'Admin' })).toHaveCount(0)
  await expect(page.getByLabel('Product name *')).toHaveCount(0)
  expect(writes).toEqual([])
})

test('an admin gets the full dashboard', async ({ page }) => {
  await mockSupabase(page, { signedIn: true, admin: true })
  await page.goto('/admin')
  await expect(page.getByRole('navigation', { name: 'Admin' })).toBeVisible()
  await expect(page.getByText('Demo mode')).toHaveCount(0)
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Add New Stock' }).click()
  await expect(page.getByLabel('Product name *')).toBeVisible()
})

/** A real, noisy camera-sized JPEG so the "original" is clearly larger than the storefront copies. */
async function cameraPhoto() {
  const [w, h] = [1000, 1400]
  const jpeg = await sharp(randomBytes(w * h * 3), { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 92 }).toBuffer()
  return { name: 'IMG_4821.jpg', mimeType: 'image/jpeg', buffer: jpeg }
}

/** Records every storage upload and signed-link request the page makes. */
async function mockStorage(page: Page) {
  const uploads: { bucket: string; name: string; body: Buffer }[] = []
  const signs: string[] = []
  await page.route(`${SUPA}/storage/v1/object/**`, (route) => {
    const req = route.request()
    if (req.method() !== 'POST' && req.method() !== 'PUT') return route.fallback()
    const { pathname } = new URL(req.url())
    const cors = { 'access-control-allow-origin': '*' }
    if (pathname.startsWith('/storage/v1/object/sign/')) {
      signs.push(pathname.replace('/storage/v1/object/sign/', ''))
      return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ signedURL: `${pathname.replace('/storage/v1', '')}?token=t` }) })
    }
    const m = /^\/storage\/v1\/object\/([^/]+)\/(.+)$/.exec(pathname)
    if (!m) return route.fallback()
    uploads.push({ bucket: m[1], name: decodeURIComponent(m[2]), body: req.postDataBuffer() ?? Buffer.alloc(0) })
    return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ Key: `${m[1]}/${m[2]}` }) })
  })
  return { uploads, signs }
}

test('an admin upload keeps the camera original byte for byte in the private bucket, apart from the storefront copies', async ({ page }) => {
  await mockSupabase(page, { signedIn: true, admin: true })
  const { uploads, signs } = await mockStorage(page)
  const photo = await cameraPhoto()
  await page.goto('/admin/products/new')
  await page.getByLabel(/Also keep the original/).waitFor()
  await page.locator('input[type=file][aria-label="Upload photos"]').setInputFiles(photo)
  await expect(page.getByRole('list', { name: 'Product photos in display order' }).locator('li')).toHaveCount(1)

  const shop = uploads.filter((u) => u.bucket === 'product-images')
  const originals = uploads.filter((u) => u.bucket === 'product-originals')
  expect(shop.map((u) => u.name.replace(/^products\/[^-]+(?:-[^-]+)*-(\d+)\..*$/, '$1')).sort()).toEqual(['1600', '480', '960'])
  expect(originals).toHaveLength(1)
  // Same id as the storefront copies, so the admin screen can link them.
  const id = shop[0].name.replace(/-\d+\.\w+$/, '')
  expect(originals[0].name).toBe(`${id}-original`)
  // The untouched camera file is in the request, and the public copies are smaller, re-encoded files.
  expect(originals[0].body.includes(photo.buffer)).toBe(true)
  for (const u of shop) expect(u.body.length).toBeLessThan(photo.buffer.length)
  expect(shop.some((u) => u.body.includes(photo.buffer))).toBe(false)

  // The admin can ask for a short-lived link to the original; nothing public points at it.
  const popup = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Download the original of photo 1' }).click()
  await popup
  expect(signs).toEqual([`product-originals/${id}-original`])
})

test('turning the option off stores only the storefront copies', async ({ page }) => {
  await mockSupabase(page, { signedIn: true, admin: true })
  const { uploads } = await mockStorage(page)
  await page.goto('/admin/products/new')
  await page.getByLabel(/Also keep the original/).uncheck()
  await page.locator('input[type=file][aria-label="Upload photos"]').setInputFiles(await cameraPhoto())
  await expect(page.getByRole('list', { name: 'Product photos in display order' }).locator('li')).toHaveCount(1)
  expect(uploads.filter((u) => u.bucket === 'product-originals')).toHaveLength(0)
  expect(uploads.filter((u) => u.bucket === 'product-images')).toHaveLength(3)
})

test('the public shop works without signing in and has no admin controls', async ({ page }) => {
  await mockSupabase(page, { signedIn: false, admin: false })
  await page.goto('/shop')
  await expect(page.getByRole('heading', { level: 1, name: /Shop all/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Add New Stock' })).toHaveCount(0)
})
