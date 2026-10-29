import type { Category, Product, StockState } from '../types'
import { singlePrice } from './pricing'

export const formatKes = (n: number): string => 'KES ' + Math.round(n).toLocaleString('en-KE')

/** Item price as shown to customers (discount, else own price, else the shop's standard price). */
export const priceLabel = (p: Pick<Product, 'priceKes'> & Partial<Pick<Product, 'discountPriceKes'>>, qty = 1): string => formatKes(singlePrice(p) * qty)

/** The struck-through "was" price, only when a discount price is set and there is a higher price to compare. */
export function wasPrice(p: Pick<Product, 'priceKes' | 'originalPriceKes' | 'discountPriceKes'>): number | null {
  if (p.discountPriceKes === null) return null
  const was = p.originalPriceKes ?? p.priceKes
  return was !== null && was > p.discountPriceKes ? was : null
}

export function stockState(p: Product): StockState {
  if (p.status === 'sold' || p.quantity === 0) return 'sold'
  if (p.status === 'reserved') return 'reserved'
  if (p.quantity !== null && p.quantity > 0) return 'in_stock'
  return 'unconfirmed'
}

/** Most units a customer may add. Unverified stock is treated as a single unit. Drafts, archived and reserved items: none. */
export function maxQuantity(p: Product): number {
  if (p.status === 'archived' || p.status === 'draft') return 0
  const s = stockState(p)
  if (s === 'sold' || s === 'reserved') return 0
  return s === 'in_stock' ? (p.quantity ?? 0) : 1
}

export const canAddToBag = (p: Product): boolean => maxQuantity(p) > 0

export function stockLabel(p: Product): string {
  switch (stockState(p)) {
    case 'sold':
      return 'Sold out'
    case 'reserved':
      return 'Reserved'
    case 'in_stock':
      return p.quantity === 1 ? 'One piece available' : `${p.quantity} available`
    default:
      return 'Confirm availability'
  }
}

export type CardStatus = { kind: 'sold'; label: string } | { kind: 'reserved'; label: string } | { kind: 'verified'; label: string } | { kind: 'check'; label: string }

/**
 * Simple status line for product cards. Only a verified stock count is ever shown as available;
 * everything else asks the customer to check with the shop, and confirmed-sold items say "Sold out".
 */
export function cardStatus(p: Product): CardStatus {
  const s = stockState(p)
  if (s === 'sold') return { kind: 'sold', label: 'Sold out' }
  if (s === 'reserved') return { kind: 'reserved', label: 'Reserved' }
  if (s === 'in_stock') return { kind: 'verified', label: stockLabel(p) }
  return { kind: 'check', label: 'Check availability →' }
}

/** Drafts and archived items never appear in the storefront. */
export const storefrontProducts = (all: Product[]): Product[] => all.filter((p) => p.status !== 'archived' && p.status !== 'draft')

export const NEW_ARRIVAL_DAYS = 30

/** A product is a new arrival if the owner flagged it, or it was published within the last NEW_ARRIVAL_DAYS days. */
export function isNewArrival(p: Product, now: number = Date.now()): boolean {
  if (p.status === 'sold' || p.status === 'archived' || p.status === 'draft') return false
  if (p.newArrival) return true
  if (!p.publishedAt) return false
  const age = now - new Date(p.publishedAt).getTime()
  return age >= 0 && age <= NEW_ARRIVAL_DAYS * 86_400_000
}

/** New arrivals, newest first. Sold-out items are left out. */
export function newArrivals(products: Product[], now: number = Date.now(), limit = 8): Product[] {
  const time = (p: Product) => new Date(p.publishedAt ?? p.createdAt).getTime()
  return products
    .filter((p) => isNewArrival(p, now) && stockState(p) !== 'sold')
    .sort((a, b) => time(b) - time(a))
    .slice(0, limit)
}

export type SortKey = 'newest' | 'featured' | 'price-asc' | 'price-desc' | 'name'
export type Availability = 'all' | 'available' | 'sold'

export interface ProductFilters {
  query: string
  category: Category | 'all'
  size: string | 'all'
  condition: string | 'all'
  availability: Availability
}

export const DEFAULT_FILTERS: ProductFilters = {
  query: '',
  category: 'all',
  size: 'all',
  condition: 'all',
  availability: 'all',
}

export function filterProducts(products: Product[], f: ProductFilters): Product[] {
  const q = f.query.trim().toLowerCase()
  return products.filter((p) => {
    if (q && !`${p.name} ${p.sku} ${p.description} ${p.category} ${p.color ?? ''} ${p.brand ?? ''}`.toLowerCase().includes(q)) return false
    if (f.category !== 'all' && p.category !== f.category) return false
    if (f.size !== 'all' && p.size !== f.size) return false
    if (f.condition !== 'all' && p.condition !== f.condition) return false
    const state = stockState(p)
    if (f.availability === 'available' && (state === 'sold' || state === 'reserved')) return false
    if (f.availability === 'sold' && state !== 'sold') return false
    return true
  })
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products]
  switch (sort) {
    case 'newest': {
      const time = (p: Product) => new Date(p.publishedAt ?? p.createdAt).getTime()
      return list.sort((a, b) => time(b) - time(a))
    }
    case 'price-asc':
      return list.sort((a, b) => singlePrice(a) - singlePrice(b))
    case 'price-desc':
      return list.sort((a, b) => singlePrice(b) - singlePrice(a))
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return list
  }
}

/** Distinct *verified* values only, so filters never offer a size or condition nobody confirmed. */
export function verifiedOptions(products: Product[], key: 'size' | 'condition'): string[] {
  return [...new Set(products.map((p) => p[key]).filter((v): v is string => Boolean(v)))].sort()
}

export function relatedProducts(products: Product[], current: Product, limit = 4): Product[] {
  const pool = products.filter((p) => p.id !== current.id && stockState(p) !== 'sold')
  const same = pool.filter((p) => p.category === current.category)
  return [...same, ...pool.filter((p) => p.category !== current.category)].slice(0, limit)
}
