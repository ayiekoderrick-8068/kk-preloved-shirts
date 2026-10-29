import type { Condition, Product, ProductStatus, ShopSettings } from '../types'

export const CONDITIONS: Condition[] = ['Like new', 'Very good', 'Good', 'Fair']
export const STATUSES: ProductStatus[] = ['draft', 'available', 'reserved', 'sold', 'archived']
export const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Draft',
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold out',
  archived: 'Archived',
}

export type ProductErrors = Partial<Record<keyof Product, string>>

const validImage = (src: string): boolean => /^(https:\/\/|\/|data:image\/(webp|jpeg|png);base64,)/.test(src)

export interface ValidateOptions {
  /** Category names the owner has set up. */
  categories: string[]
  /** Other products, to catch a duplicate SKU before the database does. */
  others?: Pick<Product, 'id' | 'sku'>[]
}

/**
 * Client-side check for the admin form. The database repeats these as constraints (supabase/migrations).
 * A draft only needs a name and a SKU so work in progress can be saved; publishing needs the full set.
 */
export function validateProduct(p: Product, { categories, others = [] }: ValidateOptions): ProductErrors {
  const e: ProductErrors = {}
  const publishing = p.status !== 'draft'
  if (!/^[A-Za-z0-9-]{2,24}$/.test(p.sku)) e.sku = 'SKU must be 2-24 letters, numbers or dashes.'
  else if (others.some((o) => o.id !== p.id && o.sku.toLowerCase() === p.sku.toLowerCase())) e.sku = 'Another product already uses this SKU.'
  if (p.name.trim().length < 2 || p.name.length > 120) e.name = 'Name must be 2-120 characters.'
  if (p.description.length > 1000) e.description = 'Description is too long (max 1000 characters).'
  if ((p.details ?? '').length > 1000) e.details = 'Garment details are too long (max 1000 characters).'
  if ((p.brand ?? '').length > 60) e.brand = 'Brand is too long.'
  if ((p.color ?? '').length > 40) e.color = 'Colour is too long.'
  if (p.size !== null && p.size.length > 16) e.size = 'Size is too long.'
  if (p.images.some((src) => !validImage(src))) e.images = 'Image URLs must start with https:// or /.'
  const m = p.measurements
  if (m && Object.values(m).some((v) => v !== undefined && (!(v > 0) || v > 200))) e.measurements = 'Measurements must be between 1 and 200 cm.'

  const money = (v: number | null) => v === null || (Number.isInteger(v) && v > 0 && v <= 1_000_000)
  if (!money(p.priceKes)) e.priceKes = 'Enter a whole-number price in KES.'
  if (!money(p.originalPriceKes)) e.originalPriceKes = 'Enter a whole-number price in KES.'
  if (!money(p.discountPriceKes)) e.discountPriceKes = 'Enter a whole-number price in KES.'
  if (p.discountPriceKes !== null && !e.discountPriceKes) {
    if (p.priceKes === null) e.discountPriceKes = 'Set the selling price first, then a lower discount price.'
    else if (p.discountPriceKes >= p.priceKes) e.discountPriceKes = 'Discount price must be lower than the selling price.'
  }
  if (p.originalPriceKes !== null && p.priceKes !== null && !e.originalPriceKes && p.originalPriceKes <= p.priceKes) {
    e.originalPriceKes = 'Original price must be higher than the selling price.'
  }
  if (p.quantity !== null && (!Number.isInteger(p.quantity) || p.quantity < 0 || p.quantity > 999)) e.quantity = 'Quantity must be a whole number from 0 to 999. It cannot be negative.'
  if (p.condition !== null && !CONDITIONS.includes(p.condition)) e.condition = 'Choose a valid condition.'
  if (!STATUSES.includes(p.status)) e.status = 'Choose a status.'

  if (publishing) {
    if (!categories.includes(p.category)) e.category = 'Choose a category.'
    if (p.priceKes === null && !e.priceKes) e.priceKes = 'Enter the selling price in KES.'
    if (!p.size?.trim()) e.size = 'Enter the size.'
    if (!p.color?.trim()) e.color = 'Enter the colour.'
    if (!p.condition) e.condition = 'Choose the condition.'
    if (p.quantity === null && !e.quantity) e.quantity = 'Enter the quantity (1 for a one-off piece).'
    if (p.description.trim().length < 5 && !e.description) e.description = 'Write a short description.'
    if (p.images.length === 0 && !e.images) e.images = 'Add at least one real photo.'
  }
  return e
}

const URL_RULES = {
  instagramUrl: /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._/-]+\/?(\?.*)?$/i,
  tiktokUrl: /^https:\/\/(www\.|vm\.)?tiktok\.com\/[A-Za-z0-9@._/-]+\/?(\?.*)?$/i,
} as const

export type SettingsErrors = Partial<Record<keyof ShopSettings, string>>

/** Pulls the digits out of a WhatsApp number or a wa.me / api.whatsapp.com link. Returns '' if it isn't one. */
export function parseWhatsApp(input: string): string {
  const v = input.trim()
  if (!v) return ''
  const fromLink = /^https:\/\/(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?(?:[^#]*&)?phone=)\+?(\d{9,15})(?:[/?&#].*)?$/i.exec(v)
  if (fromLink) return fromLink[1]
  if (/^\+?[\d\s-]{9,20}$/.test(v)) {
    let d = v.replace(/\D/g, '')
    if (d.startsWith('0')) d = '254' + d.slice(1) // Kenyan local format
    return d.length >= 11 && d.length <= 15 ? d : ''
  }
  return ''
}

export function validateSettings(s: ShopSettings, whatsappInput: string): SettingsErrors {
  const e: SettingsErrors = {}
  if (s.shopName.trim().length < 2 || s.shopName.length > 60) e.shopName = 'Shop name must be 2-60 characters.'
  if (s.slogan.length > 120) e.slogan = 'Keep the slogan under 120 characters.'
  if (s.description.length > 600) e.description = 'Keep the description under 600 characters.'
  if (s.announcement.length > 200) e.announcement = 'Keep the announcement under 200 characters.'
  if (whatsappInput.trim() && !parseWhatsApp(whatsappInput)) e.whatsappNumber = 'Enter a WhatsApp number (e.g. 0712 345 678 or +254712345678) or a wa.me link.'
  if (s.instagramUrl && !URL_RULES.instagramUrl.test(s.instagramUrl)) e.instagramUrl = 'Use a full Instagram link, e.g. https://www.instagram.com/youraccount'
  if (s.tiktokUrl && !URL_RULES.tiktokUrl.test(s.tiktokUrl)) e.tiktokUrl = 'Use a full TikTok link, e.g. https://www.tiktok.com/@youraccount'
  if (s.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.contactEmail)) e.contactEmail = 'Enter a valid email address.'
  if (s.contactPhone && !/^\+?[\d\s-]{7,20}$/.test(s.contactPhone)) e.contactPhone = 'Enter a valid phone number.'
  if (s.logoUrl && !/^(https:\/\/|\/|data:image\/)/.test(s.logoUrl)) e.logoUrl = 'Logo must be an uploaded image or an https:// link.'
  return e
}
