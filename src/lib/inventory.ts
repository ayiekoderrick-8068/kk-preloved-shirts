import type { Category, Product, StockState } from '../types'

export const formatKes = (n: number): string => 'KES ' + Math.round(n).toLocaleString('en-KE')

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
      return list.sort((a, b) => a.priceKes - b.priceKes)
    case 'price-desc':
      return list.sort((a, b) => b.priceKes - a.priceKes)
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
