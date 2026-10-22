import type { Category, Condition, Product, ProductStatus } from '../types'

export const CATEGORIES: Category[] = ['Short sleeve', 'Long sleeve']
export const CONDITIONS: Condition[] = ['Like new', 'Very good', 'Good', 'Fair']
export const STATUSES: ProductStatus[] = ['available', 'sold', 'archived']

export type ProductErrors = Partial<Record<keyof Product, string>>

/** Client-side check for the admin form. The database repeats these as constraints (supabase/schema.sql). */
export function validateProduct(p: Product): ProductErrors {
  const e: ProductErrors = {}
  if (!/^[A-Za-z0-9-]{2,24}$/.test(p.sku)) e.sku = 'SKU must be 2-24 letters, numbers or dashes.'
  if (p.name.trim().length < 2 || p.name.length > 120) e.name = 'Name must be 2-120 characters.'
  if (!CATEGORIES.includes(p.category)) e.category = 'Choose a category.'
  if (!Number.isInteger(p.priceKes) || p.priceKes <= 0 || p.priceKes > 1_000_000) e.priceKes = 'Enter a whole-number price in KES.'
  if (p.quantity !== null && (!Number.isInteger(p.quantity) || p.quantity < 0 || p.quantity > 999)) e.quantity = 'Quantity must be a whole number, or blank if unverified.'
  if (p.size !== null && p.size.length > 16) e.size = 'Size is too long.'
  if (p.condition !== null && !CONDITIONS.includes(p.condition)) e.condition = 'Choose a valid condition.'
  if (!STATUSES.includes(p.status)) e.status = 'Choose a status.'
  if (p.description.length > 1000) e.description = 'Description is too long.'
  if (p.images.length === 0) e.images = 'At least one real photo is required.'
  if (p.images.some((src) => !/^(https:\/\/|\/)/.test(src))) e.images = 'Image URLs must start with https:// or /.'
  const m = p.measurements
  if (m && Object.values(m).some((v) => v !== undefined && (!(v > 0) || v > 200))) e.measurements = 'Measurements must be between 1 and 200 cm.'
  return e
}
