// Runs the real SQL (schema.sql + migrations) in an in-process Postgres (PGlite) and attacks it the way the
// public internet would: as `anon`, as a signed-in non-admin, and as an admin. Stubs stand in for the parts of
// Supabase that PGlite does not ship (the auth/storage schemas and the anon/authenticated roles).
//
//   npm run test:db
//
// Verifies: Row Level Security on every table, CHECK/FK constraints, draft/archived privacy, the published_at
// trigger, category rename cascade, that existing data survives the migration, and that it can run twice.
import { PGlite } from '@electric-sql/pglite'
import { randomUUID } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// SQL_DIR lets a sabotaged copy of the SQL be checked, to prove these checks can actually fail.
const here = process.env.SQL_DIR ?? dirname(fileURLToPath(import.meta.url))
const sql = (f) => readFileSync(join(here, f), 'utf8')
const migrations = readdirSync(join(here, 'migrations')).filter((f) => f.endsWith('.sql')).sort()

const db = new PGlite()
const ADMIN = randomUUID()
const VISITOR = randomUUID()

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema public, auth, storage to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  grant all on all tables in schema storage to anon, authenticated;
`)

let n = 0
const q = (text, params) => db.query(text, params)

// ---- 1. original schema with LEGACY data, before the migration ------------------------------------
await db.exec(sql('schema.sql'))
await db.exec(`grant all on all tables in schema public to anon, authenticated;`)
await q(`insert into auth.users (id, email) values ($1, 'owner@example.com'), ($2, 'visitor@example.com')`, [ADMIN, VISITOR])
await q(`insert into public.admins (user_id) values ($1)`, [ADMIN])
await db.exec(`
  insert into public.products (id, sku, name, category, status, images, quantity)
  values ('legacy-1', 'KK-01', 'Legacy shirt', 'Short sleeve', 'available', '{"/assets/products/p-001.webp"}', null),
         ('legacy-2', 'KK-02', 'Legacy sold', 'Long sleeve', 'sold', '{"/assets/products/p-002.webp"}', 0);
`)

// ---- 2. migration (twice, to prove it is re-runnable) ---------------------------------------------
for (const m of migrations) {
  await db.exec(sql(`migrations/${m}`))
  await db.exec(sql(`migrations/${m}`))
}
await db.exec(`grant all on all tables in schema public to anon, authenticated;`)

// ---- helpers --------------------------------------------------------------------------------------
async function as(role, uid, fn) {
  await db.exec('reset role')
  await q(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? ''])
  await db.exec(`set role ${role}`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}
const asAnon = (fn) => as('anon', null, fn)
const asVisitor = (fn) => as('authenticated', VISITOR, fn)
const asAdmin = (fn) => as('authenticated', ADMIN, fn)

const arr = (a) => `{${a.map((s) => `"${s}"`).join(',')}}`
function product(over = {}) {
  n += 1
  return { id: `t-${n}`, sku: `T-${n}`, name: `Test ${n}`, category: 'Short sleeve', price_kes: 1500, status: 'available', images: ['https://x.supabase.co/storage/v1/object/public/product-images/products/a-1600.webp'], ...over }
}
async function insertProduct(over) {
  const p = product(over)
  const cols = Object.keys(p)
  const vals = cols.map((c) => (Array.isArray(p[c]) ? arr(p[c]) : p[c]))
  await q(`insert into public.products (${cols.join(',')}) values (${cols.map((c, i) => (c === 'images' ? `$${i + 1}::text[]` : `$${i + 1}`)).join(',')})`, vals)
  return p
}
const count = async (text, params) => Number((await q(text, params)).rows[0].count)

let failures = 0
async function check(name, fn) {
  try {
    await fn()
    console.log(`  ok    ${name}`)
  } catch (e) {
    failures += 1
    console.log(`  FAIL  ${name}\n        ${String(e.message).split('\n')[0]}`)
  }
}
const ok = (cond, msg) => {
  if (!cond) throw new Error(msg)
}
async function rejects(promise, pattern, msg) {
  try {
    await promise
  } catch (e) {
    ok(pattern.test(e.message), `${msg}: wrong error "${e.message}"`)
    return
  }
  throw new Error(`${msg}: expected an error but it succeeded`)
}

// ---- tests ----------------------------------------------------------------------------------------
console.log('Existing data and migration')
await check('legacy products survive the migration untouched', async () => {
  const r = await q(`select id, status, category, published_at, new_arrival, color from public.products where id like 'legacy-%' order by id`)
  ok(r.rows.length === 2, 'legacy rows lost')
  ok(r.rows[0].status === 'available' && r.rows[1].status === 'sold', 'legacy status changed')
  ok(r.rows.every((x) => x.published_at === null && x.new_arrival === false && x.color === null), 'legacy rows got new-arrival data they should not have')
})
await check('the two original categories are seeded', async () => {
  ok((await count(`select count(*) from public.categories where name in ('Short sleeve','Long sleeve')`)) === 2, 'categories missing')
})
await check('editing a legacy live product does not turn it into a "new arrival"', async () => {
  await q(`update public.products set quantity = 1 where id = 'legacy-1'`)
  ok((await q(`select published_at from public.products where id = 'legacy-1'`)).rows[0].published_at === null, 'published_at was stamped')
})
await check('a singleton settings row exists with blank defaults (no invented slogan or accounts)', async () => {
  const r = (await q(`select * from public.shop_settings`)).rows
  ok(r.length === 1 && r[0].slogan === '' && r[0].tiktok_url === '' && r[0].instagram_url === '', 'unexpected defaults')
})

console.log('Anonymous visitors (the public internet)')
await check('can read live products, reserved and sold-out ones, but never drafts or archived', async () => {
  await insertProduct({ id: 'draft-1', sku: 'D-1', status: 'draft', images: [] })
  await insertProduct({ id: 'arch-1', sku: 'A-1', status: 'archived' })
  await insertProduct({ id: 'res-1', sku: 'R-1', status: 'reserved' })
  const ids = await asAnon(async () => (await q(`select id from public.products`)).rows.map((r) => r.id))
  ok(ids.includes('legacy-1') && ids.includes('res-1') && ids.includes('legacy-2'), 'live products hidden')
  ok(!ids.includes('draft-1') && !ids.includes('arch-1'), 'drafts or archived leaked to the public')
})
await check('cannot insert a product', async () => {
  await rejects(asAnon(() => insertProduct({ sku: 'EVIL-1' })), /row-level security/i, 'anon insert')
})
await check('cannot update or delete a product (no rows affected, data unchanged)', async () => {
  const u = await asAnon(() => q(`update public.products set name = 'HACKED', price_kes = 1 where id = 'legacy-1'`))
  const d = await asAnon(() => q(`delete from public.products where id = 'legacy-1'`))
  ok(u.affectedRows === 0 && d.affectedRows === 0, 'anon modified rows')
  ok((await q(`select name from public.products where id = 'legacy-1'`)).rows[0].name === 'Legacy shirt', 'row changed')
})
await check('cannot write categories, settings or the admins table', async () => {
  await rejects(asAnon(() => q(`insert into public.categories (name) values ('Evil')`)), /row-level security/i, 'categories insert')
  const s = await asAnon(() => q(`update public.shop_settings set shop_name = 'HACKED'`))
  ok(s.affectedRows === 0, 'settings changed')
  await rejects(asAnon(() => q(`insert into public.admins (user_id) values ($1)`, [VISITOR])), /row-level security/i, 'admins insert')
})
await check('cannot read the admins list', async () => {
  ok((await asAnon(() => count(`select count(*) from public.admins`))) === 0, 'admins visible')
})
await check('can read categories and shop settings', async () => {
  ok((await asAnon(() => count(`select count(*) from public.categories`))) >= 2, 'categories hidden')
  ok((await asAnon(() => count(`select count(*) from public.shop_settings`))) === 1, 'settings hidden')
})
await check('cannot upload to the product photo bucket', async () => {
  await rejects(asAnon(() => q(`insert into storage.objects (bucket_id, name) values ('product-images', 'x.webp')`)), /row-level security/i, 'storage insert')
})

console.log('Inquiries log (anonymous insert-only)')
await check('visitors can log an inquiry but not read, change or delete any', async () => {
  await asAnon(() => q(`insert into public.inquiries (product_id, product_name, sku, channel) values ('legacy-1', 'Legacy shirt', 'KK-01', 'product-inquiry')`))
  ok((await asAnon(() => count(`select count(*) from public.inquiries`))) === 0, 'visitor can read inquiries')
  ok((await asAnon(() => q(`update public.inquiries set handled = true`))).affectedRows === 0, 'visitor updated inquiries')
  ok((await asAnon(() => q(`delete from public.inquiries`))).affectedRows === 0, 'visitor deleted inquiries')
})
await check('visitors cannot pre-mark an inquiry handled, or use an unknown channel, or oversized text', async () => {
  await rejects(asAnon(() => q(`insert into public.inquiries (product_name, channel, handled) values ('x', 'product-inquiry', true)`)), /row-level security/i, 'handled insert')
  await rejects(asAnon(() => q(`insert into public.inquiries (product_name, channel) values ('x', 'spam')`)), /check constraint/i, 'channel')
  await rejects(asAnon(() => q(`insert into public.inquiries (product_name, channel) values ($1, 'product-inquiry')`, ['x'.repeat(500)])), /check constraint/i, 'length')
})
await check('an inquiry never changes stock', async () => {
  const r = (await q(`select status, quantity from public.products where id = 'legacy-1'`)).rows[0]
  ok(r.status === 'available' && r.quantity === 1, 'stock changed by an inquiry')
})

console.log('Signed-in user who is NOT an admin')
await check('cannot add, change or delete anything', async () => {
  await rejects(asVisitor(() => insertProduct({ sku: 'EVIL-2' })), /row-level security/i, 'insert')
  ok((await asVisitor(() => q(`update public.products set name = 'HACKED'`))).affectedRows === 0, 'update')
  ok((await asVisitor(() => q(`delete from public.products`))).affectedRows === 0, 'delete')
  ok((await asVisitor(() => q(`update public.shop_settings set slogan = 'HACKED'`))).affectedRows === 0, 'settings')
  await rejects(asVisitor(() => q(`insert into public.categories (name) values ('Evil')`)), /row-level security/i, 'categories')
  await rejects(asVisitor(() => q(`insert into storage.objects (bucket_id, name) values ('product-images', 'x.webp')`)), /row-level security/i, 'storage')
  await rejects(asVisitor(() => q(`insert into public.admins (user_id) values ($1)`, [VISITOR])), /row-level security/i, 'self-promote')
})
await check('cannot see drafts or inquiries', async () => {
  const ids = await asVisitor(async () => (await q(`select id from public.products`)).rows.map((r) => r.id))
  ok(!ids.includes('draft-1'), 'draft visible')
  ok((await asVisitor(() => count(`select count(*) from public.inquiries`))) === 0, 'inquiries visible')
})

console.log('Admin')
await check('sees drafts and archived products', async () => {
  const ids = await asAdmin(async () => (await q(`select id from public.products`)).rows.map((r) => r.id))
  ok(ids.includes('draft-1') && ids.includes('arch-1'), 'admin cannot see drafts')
})
await check('can add, edit and delete products, and upload photos', async () => {
  await asAdmin(() => insertProduct({ id: 'adm-1', sku: 'ADM-1' }))
  ok((await asAdmin(() => q(`update public.products set price_kes = 1800 where id = 'adm-1'`))).affectedRows === 1, 'update')
  ok((await asAdmin(() => q(`delete from public.products where id = 'adm-1'`))).affectedRows === 1, 'delete')
  await asAdmin(() => q(`insert into storage.objects (bucket_id, name) values ('product-images', 'products/x-1600.webp')`))
})
await check('a draft needs no photos, but a published product needs one', async () => {
  await asAdmin(() => insertProduct({ sku: 'DR-1', status: 'draft', images: [] }))
  await rejects(asAdmin(() => insertProduct({ sku: 'NP-1', images: [] })), /products_images_rule/, 'published without photo')
})
await check('quantity cannot be negative or above 999', async () => {
  await rejects(asAdmin(() => insertProduct({ sku: 'NQ-1', quantity: -1 })), /check constraint/i, 'negative')
  await rejects(asAdmin(() => insertProduct({ sku: 'NQ-2', quantity: 1000 })), /check constraint/i, 'too many')
})
await check('prices must be sensible: discount below price, original above price', async () => {
  await rejects(asAdmin(() => insertProduct({ sku: 'DP-1', discount_price_kes: 1500 })), /products_discount_rule/, 'discount = price')
  await rejects(asAdmin(() => insertProduct({ sku: 'DP-2', price_kes: null, discount_price_kes: 100 })), /products_discount_rule/, 'discount without price')
  await rejects(asAdmin(() => insertProduct({ sku: 'DP-3', original_price_kes: 1000 })), /products_original_rule/, 'original below price')
  await rejects(asAdmin(() => insertProduct({ sku: 'DP-4', price_kes: -5 })), /check constraint/i, 'negative price')
  await asAdmin(() => insertProduct({ sku: 'DP-5', discount_price_kes: 1200, original_price_kes: 2000 }))
})
await check('duplicate SKUs and unknown statuses/categories are rejected', async () => {
  await rejects(asAdmin(() => insertProduct({ sku: 'KK-01' })), /duplicate key|unique/i, 'duplicate sku')
  await rejects(asAdmin(() => insertProduct({ sku: 'ST-1', status: 'pending' })), /products_status_values|check constraint/i, 'status')
  await rejects(asAdmin(() => insertProduct({ sku: 'CT-1', category: 'Nonexistent' })), /foreign key/i, 'category')
})
await check('photo links must be https:// or site-relative (no javascript:/data:/http:)', async () => {
  for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAAA', 'http://x.example/a.jpg']) {
    await rejects(asAdmin(() => insertProduct({ sku: `IM-${n}`, images: [bad] })), /products_images_rule/, bad)
  }
  await asAdmin(() => insertProduct({ sku: 'IM-OK', images: ['/assets/products/p-001.webp'] }))
})
await check('published_at is stamped when a draft is published, and not before', async () => {
  const before = (await q(`select published_at from public.products where sku = 'DR-1'`)).rows[0].published_at
  ok(before === null, 'draft already has a publish date')
  await asAdmin(() => q(`update public.products set images = '{"/assets/products/p-001.webp"}', status = 'available' where sku = 'DR-1'`))
  const after = (await q(`select published_at from public.products where sku = 'DR-1'`)).rows[0].published_at
  ok(after !== null && Math.abs(Date.now() - new Date(after).getTime()) < 60_000, 'published_at not stamped')
  const direct = await asAdmin(() => insertProduct({ sku: 'PUB-1' }))
  ok((await q(`select published_at from public.products where id = $1`, [direct.id])).rows[0].published_at !== null, 'direct publish not stamped')
})
await check('categories: add, rename (cascades to products), and cannot delete one still in use', async () => {
  await asAdmin(() => q(`insert into public.categories (name) values ('Trousers')`))
  await asAdmin(() => insertProduct({ sku: 'TR-1', category: 'Trousers' }))
  await asAdmin(() => q(`update public.categories set name = 'Pants' where name = 'Trousers'`))
  ok((await q(`select category from public.products where sku = 'TR-1'`)).rows[0].category === 'Pants', 'rename did not cascade')
  await rejects(asAdmin(() => q(`delete from public.categories where name = 'Pants'`)), /foreign key/i, 'delete in-use category')
})
await check('shop settings: valid values save; bad links, numbers and emails are rejected by the database', async () => {
  await asAdmin(() => q(`update public.shop_settings set shop_name='Kendy Thrift Shop', slogan='x', whatsapp_number='254712345678', instagram_url='https://www.instagram.com/some.shop', tiktok_url='https://www.tiktok.com/@some.shop', contact_email='a@b.co'`))
  const bad = [
    [`instagram_url='http://instagram.com/x'`, 'instagram http'],
    [`instagram_url='https://evil.example/instagram.com/x'`, 'instagram host'],
    [`tiktok_url='https://example.com/@x'`, 'tiktok host'],
    [`whatsapp_number='82'`, 'short whatsapp'],
    [`whatsapp_number='+254712345678'`, 'whatsapp plus sign'],
    [`contact_email='nope'`, 'email'],
    [`logo_url='javascript:1'`, 'logo'],
  ]
  for (const [set, label] of bad) await rejects(asAdmin(() => q(`update public.shop_settings set ${set}`)), /check constraint/i, label)
  ok((await q(`select shop_name from public.shop_settings`)).rows[0].shop_name === 'Kendy Thrift Shop', 'settings not saved')
})
await check('can read and manage inquiries', async () => {
  ok((await asAdmin(() => count(`select count(*) from public.inquiries`))) >= 1, 'admin cannot read inquiries')
  ok((await asAdmin(() => q(`update public.inquiries set handled = true`))).affectedRows >= 1, 'admin cannot update')
})

console.log(failures === 0 ? '\nAll database checks passed.' : `\n${failures} database check(s) FAILED.`)
process.exit(failures === 0 ? 0 : 1)
