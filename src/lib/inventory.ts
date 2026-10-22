import type { Category, Product, StockState } from '../types'
import { singlePrice } from './pricing'

export const formatKes = (n: number): string => 'KES ' + Math.round(n).toLocaleString('en-KE')

/** Single-shirt price as shown to customers (the shop's standard price unless the product has its own). */
export const priceLabel = (p: Pick<Product, 'priceKes'>, qty = 1): string => formatKes(singlePrice(p) * qty)

export function stockState(p: Product): StockState {
  if (p.status === 'sold' || p.quantity === 0) return 'sold'
  if (p.quantity !== null && p.quantity > 0) return 'in_stock'
  return 'unconfirmed'
}

/** Most units a customer may add. Unverified stock is treated as a single unit. */
export function maxQuantity(p: Product): number {
  const s = stockState(p)
  if (p.status === 'archived' || s === 'sold') return 0
  return s === 'in_stock' ? (p.quantity ?? 0) : 1
}

export const canAddToBag = (p: Product): boolean => maxQuantity(p) > 0

export function stockLabel(p: Product): string {
  switch (stockState(p)) {
    case 'sold':
      return 'Sold'
    case 'in_stock':
      return p.quantity === 1 ? 'One piece available' : `${p.quantity} available`
    default:
      return 'Confirm availability'
  }
}

export type CardStatus = { kind: 'sold'; label: string } | { kind: 'verified'; label: string } | { kind: 'check'; label: string }

/**
 * Simple status line for product cards. Only a verified stock count is ever shown as available;
 * everything else asks the customer to check with the shop, and confirmed-sold items say "Sold out".
 */
export function cardStatus(p: Product): CardStatus {
  const s = stockState(p)
  if (s === 'sold') return { kind: 'sold', label: 'Sold out' }
  if (s === 'in_stock') return { kind: 'verified', label: stockLabel(p) }
  return { kind: 'check', label: 'Check availability →' }
}

/** Archived items never appear in the storefront. */
export const storefrontProducts = (all: Product[]): Product[] => all.filter((p) => p.status !== 'archived')

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name'
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
    if (q && !`${p.name} ${p.sku} ${p.description} ${p.category}`.toLowerCase().includes(q)) return false
    if (f.category !== 'all' && p.category !== f.category) return false
    if (f.size !== 'all' && p.size !== f.size) return false
    if (f.condition !== 'all' && p.condition !== f.condition) return false
    const sold = stockState(p) === 'sold'
    if (f.availability === 'available' && sold) return false
    if (f.availability === 'sold' && !sold) return false
    return true
  })
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products]
  switch (sort) {
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
