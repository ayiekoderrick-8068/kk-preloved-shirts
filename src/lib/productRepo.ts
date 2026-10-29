import { SEED_PRODUCTS } from '../data/seed'
import type { Product } from '../types'
import { blobToDataUrl, checkImageFile, IMAGE_WIDTHS, originalPathFor, resizeImage } from './images'
import { supabase } from './supabase'

const DEMO_KEY = 'kk-preloved-shirts:demo-inventory:v2'
const DEMO_KEY_V1 = 'kk-preloved-shirts:demo-inventory:v1'

interface Row {
  id: string
  sku: string
  name: string
  category: Product['category']
  description: string
  price_kes: number | null
  original_price_kes: number | null
  discount_price_kes: number | null
  size: string | null
  color: string | null
  brand: string | null
  measurements: Product['measurements']
  condition: Product['condition']
  flaws: string | null
  details: string | null
  quantity: number | null
  status: Product['status']
  images: string[]
  featured: boolean
  new_arrival: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

const fromRow = (r: Row): Product => ({
  id: r.id,
  sku: r.sku,
  name: r.name,
  category: r.category,
  description: r.description,
  priceKes: r.price_kes,
  originalPriceKes: r.original_price_kes ?? null,
  discountPriceKes: r.discount_price_kes ?? null,
  size: r.size,
  color: r.color ?? null,
  brand: r.brand ?? null,
  measurements: r.measurements,
  condition: r.condition,
  flaws: r.flaws,
  details: r.details ?? null,
  quantity: r.quantity,
  status: r.status,
  images: r.images ?? [],
  featured: r.featured,
  newArrival: r.new_arrival ?? false,
  publishedAt: r.published_at ?? null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

const toRow = (p: Product) => ({
  id: p.id,
  sku: p.sku.trim(),
  name: p.name.trim(),
  category: p.category,
  description: p.description,
  price_kes: p.priceKes,
  original_price_kes: p.originalPriceKes,
  discount_price_kes: p.discountPriceKes,
  size: p.size,
  color: p.color,
  brand: p.brand,
  measurements: p.measurements,
  condition: p.condition,
  flaws: p.flaws,
  details: p.details,
  quantity: p.quantity,
  status: p.status,
  images: p.images,
  featured: p.featured,
  new_arrival: p.newArrival,
  published_at: p.publishedAt,
})

/** Fills fields added after a browser-local demo copy was saved. */
type NewFields = 'originalPriceKes' | 'discountPriceKes' | 'color' | 'brand' | 'details' | 'newArrival' | 'publishedAt'
const normalize = (p: Omit<Product, NewFields> & Partial<Pick<Product, NewFields>>): Product => ({
  originalPriceKes: null,
  discountPriceKes: null,
  color: null,
  brand: null,
  details: null,
  newArrival: false,
  publishedAt: null,
  ...p,
})

function readDemo(): Product[] | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY) ?? localStorage.getItem(DEMO_KEY_V1)
    return raw ? (JSON.parse(raw) as Parameters<typeof normalize>[0][]).map(normalize) : null
  } catch {
    return null
  }
}

function writeDemo(products: Product[]): void {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(products))
  } catch {
    throw new Error('This browser has no room left for demo data. Remove some demo photos, or connect the database.')
  }
}

export const isBackendConfigured = (): boolean => supabase !== null

/** Maps a database error to a message the shop owner can act on. */
export function friendlyError(error: { message: string; code?: string }): string {
  if (error.code === '23505' && /sku/i.test(error.message)) return 'Another product already uses this SKU. Choose a different one.'
  if (error.code === '23505') return 'That already exists.'
  if (error.code === '23503') return 'This is still in use, so it cannot be removed.'
  if (error.code === '42501' || /row-level security/i.test(error.message)) return 'You do not have permission to do that. Sign in as an admin.'
  if (error.code === '23514') return 'One of the values is not allowed (check prices, quantity and links).'
  return error.message
}

/** Public storefront read. Falls back to the bundled seed (and any local demo edits) without a backend. */
export async function loadProducts(): Promise<Product[]> {
  if (!supabase) return readDemo() ?? SEED_PRODUCTS
  const { data, error } = await supabase.from('products').select('*').order('published_at', { ascending: false, nullsFirst: false }).order('sku')
  if (error) throw new Error(friendlyError(error))
  return (data as Row[]).map(fromRow)
}

/** Stamps the publish date the first time a product leaves draft (the database trigger does the same). */
function withPublishDate(p: Product, previous: Product | undefined): Product {
  if (p.status === 'draft' || p.publishedAt) return p
  return !previous || previous.status === 'draft' ? { ...p, publishedAt: new Date().toISOString() } : p
}

export async function saveProduct(product: Product, current: Product[]): Promise<Product[]> {
  const previous = current.find((p) => p.id === product.id)
  if (!supabase) {
    const now = new Date().toISOString()
    const next = { ...withPublishDate(product, previous), updatedAt: now }
    const list = previous ? current.map((p) => (p.id === product.id ? next : p)) : [...current, { ...next, createdAt: now }]
    writeDemo(list)
    return list
  }
  const { error } = await supabase.from('products').upsert(toRow(product))
  if (error) throw new Error(friendlyError(error))
  return loadProducts()
}

export async function deleteProduct(id: string, current: Product[]): Promise<Product[]> {
  if (!supabase) {
    const list = current.filter((p) => p.id !== id)
    writeDemo(list)
    return list
  }
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(friendlyError(error))
  return loadProducts()
}

export async function importSeed(current: Product[]): Promise<Product[]> {
  if (!supabase) return current
  const existing = new Set(current.map((p) => p.sku))
  const fresh = SEED_PRODUCTS.filter((p) => !existing.has(p.sku)).map((p) => toRow(p))
  if (fresh.length) {
    const { error } = await supabase.from('products').insert(fresh)
    if (error) throw new Error(friendlyError(error))
  }
  return loadProducts()
}

export function resetDemo(): Product[] {
  try {
    localStorage.removeItem(DEMO_KEY)
    localStorage.removeItem(DEMO_KEY_V1)
  } catch {
    /* ignore */
  }
  return SEED_PRODUCTS
}

/** Upper bound for a demo-mode photo (stored in this browser only). */
const DEMO_MAX_BYTES = 220 * 1024

/**
 * Compresses a photo into three responsive WebP sizes and uploads them to the product-images bucket.
 * Returns the URL of the largest size; the storefront derives the others (see lib/images.ts).
 * In demo mode (no database) a single small copy is kept in this browser instead, for trying the workflow.
 */
export interface UploadOptions {
  /** Also keep the untouched camera original in the private `product-originals` bucket (admins only). */
  keepOriginal?: boolean
  /** Called when the shop photo was saved but something secondary (the original) was not. */
  onWarning?: (message: string) => void
}

export async function uploadImage(file: File, folder = 'products', opts: UploadOptions = {}): Promise<string> {
  const problem = checkImageFile(file)
  if (problem) throw new Error(problem)

  if (!supabase) {
    for (const edge of [960, 640, 480]) {
      const v = await resizeImage(file, edge, 0.8)
      if (v.blob.size <= DEMO_MAX_BYTES) return blobToDataUrl(v.blob)
    }
    throw new Error('That photo is too detailed for demo mode. Connect the database to upload full-size photos.')
  }

  const id = crypto.randomUUID()
  const bucket = supabase.storage.from('product-images')
  const variants = await Promise.all(IMAGE_WIDTHS.map((w) => resizeImage(file, w)))
  const names = variants.map((v, i) => `${folder}/${id}-${IMAGE_WIDTHS[i]}.${v.ext}`)
  const results = await Promise.all(
    variants.map((v, i) => bucket.upload(names[i], v.blob, { contentType: v.blob.type, cacheControl: '31536000', upsert: false })),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    await bucket.remove(names) // don't leave half an upload behind
    throw new Error(failed.error.message)
  }
  if (opts.keepOriginal) {
    // The file as it left the camera: never resized or re-encoded. A failure here must not lose the shop photo.
    const original = await supabase.storage.from('product-originals').upload(`${folder}/${id}-original`, file, { contentType: file.type, upsert: false })
    if (original.error) opts.onWarning?.(`"${file.name}" was added to the shop, but its full-resolution original could not be kept (${original.error.message}).`)
  }
  return bucket.getPublicUrl(names[names.length - 1]).data.publicUrl
}

/**
 * Short-lived download link for a photo's private original. Only a signed-in admin can get one (enforced by the
 * database, not just by this screen). Throws a plain-language message when there is none.
 */
export async function originalDownloadUrl(photoUrl: string): Promise<string> {
  const path = originalPathFor(photoUrl)
  if (!supabase || !path) throw new Error('No original is stored for this photo.')
  const { data, error } = await supabase.storage.from('product-originals').createSignedUrl(path, 120, { download: true })
  if (error || !data) throw new Error('No original is stored for this photo (it may have been added before originals were kept).')
  return data.signedUrl
}
