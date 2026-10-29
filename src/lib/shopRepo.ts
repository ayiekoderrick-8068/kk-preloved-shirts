import type { CategoryItem, Inquiry, Product, ShopSettings } from '../types'
import { friendlyError } from './productRepo'
import { supabase } from './supabase'

/*
 * Categories, shop settings and the inquiries log. With Supabase configured everything is stored in the
 * database (writes are limited to admins by Row Level Security). Without it, a browser-local demo copy is
 * used so the admin workflow can be tried; demo data is never visible to customers.
 */

const KEYS = {
  categories: 'kk-preloved-shirts:demo-categories:v1',
  settings: 'kk-preloved-shirts:demo-settings:v1',
  inquiries: 'kk-preloved-shirts:demo-inquiries:v1',
}

function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable - demo edits just won't persist */
  }
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-short', name: 'Short sleeve', sortOrder: 1 },
  { id: 'cat-long', name: 'Long sleeve', sortOrder: 2 },
]

// ---- Categories ---------------------------------------------------------------------------------

interface CategoryRow {
  id: string
  name: string
  sort_order: number
}

const byOrder = (a: CategoryItem, b: CategoryItem) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)

export async function loadCategories(): Promise<CategoryItem[]> {
  if (!supabase) return (readLocal<CategoryItem[]>(KEYS.categories) ?? DEFAULT_CATEGORIES).sort(byOrder)
  const { data, error } = await supabase.from('categories').select('id,name,sort_order').order('sort_order').order('name')
  if (error) throw new Error(friendlyError(error))
  return (data as CategoryRow[]).map((r) => ({ id: r.id, name: r.name, sortOrder: r.sort_order }))
}

export const validCategoryName = (name: string): string | null =>
  name.trim().length < 2 || name.trim().length > 40 ? 'Category names must be 2-40 characters.' : null

export async function addCategory(name: string, current: CategoryItem[]): Promise<CategoryItem[]> {
  const clean = name.trim()
  const bad = validCategoryName(clean)
  if (bad) throw new Error(bad)
  if (current.some((c) => c.name.toLowerCase() === clean.toLowerCase())) throw new Error('That category already exists.')
  const sortOrder = Math.max(0, ...current.map((c) => c.sortOrder)) + 1
  if (!supabase) {
    const next = [...current, { id: crypto.randomUUID(), name: clean, sortOrder }]
    writeLocal(KEYS.categories, next)
    return next
  }
  const { error } = await supabase.from('categories').insert({ name: clean, sort_order: sortOrder })
  if (error) throw new Error(friendlyError(error))
  return loadCategories()
}

/** Renaming also renames the category on every product (the database cascades it). */
export async function renameCategory(id: string, name: string, current: CategoryItem[]): Promise<CategoryItem[]> {
  const clean = name.trim()
  const bad = validCategoryName(clean)
  if (bad) throw new Error(bad)
  if (current.some((c) => c.id !== id && c.name.toLowerCase() === clean.toLowerCase())) throw new Error('That category already exists.')
  if (!supabase) {
    const next = current.map((c) => (c.id === id ? { ...c, name: clean } : c))
    writeLocal(KEYS.categories, next)
    return next
  }
  const { error } = await supabase.from('categories').update({ name: clean }).eq('id', id)
  if (error) throw new Error(friendlyError(error))
  return loadCategories()
}

export async function deleteCategory(id: string, current: CategoryItem[], products: Product[]): Promise<CategoryItem[]> {
  const cat = current.find((c) => c.id === id)
  if (cat && products.some((p) => p.category === cat.name)) {
    throw new Error(`"${cat.name}" still has products. Move them to another category first.`)
  }
  if (!supabase) {
    const next = current.filter((c) => c.id !== id)
    writeLocal(KEYS.categories, next)
    return next
  }
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(friendlyError(error))
  return loadCategories()
}

// ---- Shop settings ------------------------------------------------------------------------------

interface SettingsRow {
  shop_name: string
  slogan: string
  logo_url: string
  whatsapp_number: string
  instagram_url: string
  tiktok_url: string
  contact_email: string
  contact_phone: string
  announcement: string
  description: string
}

const fromSettingsRow = (r: SettingsRow): Partial<ShopSettings> => ({
  shopName: r.shop_name,
  slogan: r.slogan,
  logoUrl: r.logo_url,
  whatsappNumber: r.whatsapp_number,
  instagramUrl: r.instagram_url,
  tiktokUrl: r.tiktok_url,
  contactEmail: r.contact_email,
  contactPhone: r.contact_phone,
  announcement: r.announcement,
  description: r.description,
})

/** The owner's saved values (possibly partial). Blank fields mean "use the built-in default". */
export async function loadSettingsOverrides(): Promise<Partial<ShopSettings>> {
  if (!supabase) return readLocal<Partial<ShopSettings>>(KEYS.settings) ?? {}
  const { data, error } = await supabase.from('shop_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw new Error(friendlyError(error))
  return data ? fromSettingsRow(data as SettingsRow) : {}
}

export async function saveSettings(s: ShopSettings): Promise<void> {
  if (!supabase) {
    writeLocal(KEYS.settings, s)
    return
  }
  const { error } = await supabase.from('shop_settings').upsert({
    id: 1,
    shop_name: s.shopName.trim(),
    slogan: s.slogan.trim(),
    logo_url: s.logoUrl.trim(),
    whatsapp_number: s.whatsappNumber,
    instagram_url: s.instagramUrl.trim(),
    tiktok_url: s.tiktokUrl.trim(),
    contact_email: s.contactEmail.trim(),
    contact_phone: s.contactPhone.trim(),
    announcement: s.announcement.trim(),
    description: s.description.trim(),
  })
  if (error) throw new Error(friendlyError(error))
}

// ---- Inquiries ----------------------------------------------------------------------------------

interface InquiryRow {
  id: string
  product_id: string | null
  product_name: string
  sku: string
  channel: Inquiry['channel']
  handled: boolean
  created_at: string
}

const fromInquiryRow = (r: InquiryRow): Inquiry => ({
  id: r.id,
  productId: r.product_id,
  productName: r.product_name,
  sku: r.sku,
  channel: r.channel,
  handled: r.handled,
  createdAt: r.created_at,
})

/**
 * Records that a customer tapped a WhatsApp button for a product. Stores only the product and the time (no
 * personal details) and never changes stock. Failures are ignored so they can never block opening WhatsApp.
 */
export function logInquiry(product: Pick<Product, 'id' | 'name' | 'sku'>, channel: Inquiry['channel']): void {
  const entry = { product_name: product.name.slice(0, 120), sku: product.sku.slice(0, 24), channel }
  if (!supabase) {
    const list = readLocal<InquiryRow[]>(KEYS.inquiries) ?? []
    writeLocal(KEYS.inquiries, [{ id: crypto.randomUUID(), product_id: product.id, handled: false, created_at: new Date().toISOString(), ...entry }, ...list].slice(0, 200))
    return
  }
  void supabase.from('inquiries').insert({ product_id: product.id, ...entry }).then(() => undefined, () => undefined)
}

export async function loadInquiries(): Promise<Inquiry[]> {
  if (!supabase) return (readLocal<InquiryRow[]>(KEYS.inquiries) ?? []).map(fromInquiryRow)
  const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(200)
  if (error) throw new Error(friendlyError(error))
  return (data as InquiryRow[]).map(fromInquiryRow)
}

export async function setInquiryHandled(id: string, handled: boolean): Promise<void> {
  if (!supabase) {
    const list = readLocal<InquiryRow[]>(KEYS.inquiries) ?? []
    writeLocal(KEYS.inquiries, list.map((r) => (r.id === id ? { ...r, handled } : r)))
    return
  }
  const { error } = await supabase.from('inquiries').update({ handled }).eq('id', id)
  if (error) throw new Error(friendlyError(error))
}

export async function deleteInquiry(id: string): Promise<void> {
  if (!supabase) {
    writeLocal(KEYS.inquiries, (readLocal<InquiryRow[]>(KEYS.inquiries) ?? []).filter((r) => r.id !== id))
    return
  }
  const { error } = await supabase.from('inquiries').delete().eq('id', id)
  if (error) throw new Error(friendlyError(error))
}
