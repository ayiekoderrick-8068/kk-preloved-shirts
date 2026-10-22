import { SEED_PRODUCTS } from '../data/seed'
import type { Product } from '../types'
import { supabase } from './supabase'

const DEMO_KEY = 'kk-preloved-shirts:demo-inventory:v1'

interface Row {
  id: string
  sku: string
  name: string
  category: Product['category']
  description: string
  price_kes: number
  size: string | null
  measurements: Product['measurements']
  condition: Product['condition']
  flaws: string | null
  quantity: number | null
  status: Product['status']
  images: string[]
  featured: boolean
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
  size: r.size,
  measurements: r.measurements,
  condition: r.condition,
  flaws: r.flaws,
  quantity: r.quantity,
  status: r.status,
  images: r.images,
  featured: r.featured,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

const toRow = (p: Product) => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  category: p.category,
  description: p.description,
  price_kes: p.priceKes,
  size: p.size,
  measurements: p.measurements,
  condition: p.condition,
  flaws: p.flaws,
  quantity: p.quantity,
  status: p.status,
  images: p.images,
  featured: p.featured,
})

function readDemo(): Product[] | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    return raw ? (JSON.parse(raw) as Product[]) : null
  } catch {
    return null
  }
}

function writeDemo(products: Product[]): void {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(products))
  } catch {
    /* storage unavailable - demo edits just won't persist */
  }
}

export const isBackendConfigured = (): boolean => supabase !== null

/** Public storefront read. Falls back to the bundled seed (and any local demo edits) without a backend. */
export async function loadProducts(): Promise<Product[]> {
  if (!supabase) return readDemo() ?? SEED_PRODUCTS
  const { data, error } = await supabase.from('products').select('*').order('sku')
  if (error) throw new Error(error.message)
  return (data as Row[]).map(fromRow)
}

export async function saveProduct(product: Product, current: Product[]): Promise<Product[]> {
  if (!supabase) {
    const now = new Date().toISOString()
    const next = { ...product, updatedAt: now }
    const list = current.some((p) => p.id === product.id) ? current.map((p) => (p.id === product.id ? next : p)) : [...current, { ...next, createdAt: now }]
    writeDemo(list)
    return list
  }
  const { error } = await supabase.from('products').upsert(toRow(product))
  if (error) throw new Error(error.message)
  return loadProducts()
}

export async function importSeed(current: Product[]): Promise<Product[]> {
  if (!supabase) return current
  const existing = new Set(current.map((p) => p.sku))
  const fresh = SEED_PRODUCTS.filter((p) => !existing.has(p.sku)).map((p) => toRow(p))
  if (fresh.length) {
    const { error } = await supabase.from('products').insert(fresh)
    if (error) throw new Error(error.message)
  }
  return loadProducts()
}

export function resetDemo(): Product[] {
  try {
    localStorage.removeItem(DEMO_KEY)
  } catch {
    /* ignore */
  }
  return SEED_PRODUCTS
}

export async function uploadImage(file: File): Promise<string> {
  if (!supabase) throw new Error('Image upload needs the Supabase backend. Paste an image URL instead in demo mode.')
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Use a JPEG, PNG or WebP image.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB.')
  const ext = file.type.split('/')[1]
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type })
  if (error) throw new Error(error.message)
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}
