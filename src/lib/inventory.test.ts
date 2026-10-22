import { describe, expect, it } from 'vitest'
import { SEED_PRODUCTS } from '../data/seed'
import type { Product } from '../types'
import { DEFAULT_FILTERS, canAddToBag, cardStatus, filterProducts, maxQuantity, sortProducts, stockState, storefrontProducts, verifiedOptions } from './inventory'

const base = SEED_PRODUCTS[0]
const make = (over: Partial<Product>): Product => ({ ...base, ...over })

describe('stockState / maxQuantity', () => {
  it('treats unverified stock as unconfirmed, limited to one unit', () => {
    const p = make({ quantity: null })
    expect(stockState(p)).toBe('unconfirmed')
    expect(maxQuantity(p)).toBe(1)
  })
  it('uses verified quantity', () => {
    const p = make({ quantity: 3 })
    expect(stockState(p)).toBe('in_stock')
    expect(maxQuantity(p)).toBe(3)
  })
  it('sold or zero-stock items cannot be added', () => {
    expect(canAddToBag(make({ status: 'sold' }))).toBe(false)
    expect(canAddToBag(make({ quantity: 0 }))).toBe(false)
    expect(canAddToBag(make({ status: 'archived' }))).toBe(false)
  })
})

describe('cardStatus', () => {
  it('asks to check availability unless stock is verified', () => {
    expect(cardStatus(make({ quantity: null }))).toEqual({ kind: 'check', label: 'Check availability →' })
  })
  it('only shows availability for a verified stock count', () => {
    expect(cardStatus(make({ quantity: 1 })).kind).toBe('verified')
    expect(cardStatus(make({ quantity: 3 })).label).toBe('3 available')
  })
  it('says Sold out for confirmed-sold items, which cannot be ordered', () => {
    for (const p of [make({ status: 'sold' }), make({ quantity: 0 })]) {
      expect(cardStatus(p)).toEqual({ kind: 'sold', label: 'Sold out' })
      expect(canAddToBag(p)).toBe(false)
    }
  })
})

describe('seed data', () => {
  it('has unique products, each with real photos and nothing invented', () => {
    expect(SEED_PRODUCTS.length).toBeGreaterThanOrEqual(30)
    expect(new Set(SEED_PRODUCTS.map((p) => p.sku)).size).toBe(SEED_PRODUCTS.length)
    const photos = SEED_PRODUCTS.flatMap((p) => p.images)
    expect(new Set(photos).size).toBe(photos.length) // a photo belongs to exactly one product
    for (const p of SEED_PRODUCTS) {
      expect(p.images.length).toBeGreaterThan(0)
      for (const img of p.images) expect(img).toMatch(/^\/assets\/products\/p-\d{3}\.webp$/)
      expect(p.priceKes).toBeNull()
      expect(p.size).toBeNull()
      expect(p.condition).toBeNull()
      expect(p.quantity).toBeNull()
    }
  })
})

describe('filter and sort', () => {
  const products = [
    make({ id: 'a', name: 'Alpha', priceKes: 2000, size: 'M', condition: 'Good', category: 'Long sleeve' }),
    make({ id: 'b', name: 'Beta', priceKes: 1000, size: 'L', condition: 'Like new', status: 'sold' }),
    make({ id: 'c', name: 'Gamma', priceKes: 1500, size: null, condition: null }),
  ]
  it('sorts standard-priced items at the standard price', () => {
    const withStd = [...products, make({ id: 'n', name: 'Nope', priceKes: null })]
    expect(sortProducts(withStd, 'price-asc').map((p) => p.id)).toEqual(['n', 'b', 'c', 'a'])
    expect(sortProducts(withStd, 'price-desc').map((p) => p.id)).toEqual(['a', 'c', 'b', 'n'])
  })
  it('searches by name', () => {
    expect(filterProducts(products, { ...DEFAULT_FILTERS, query: 'gam' }).map((p) => p.id)).toEqual(['c'])
  })
  it('filters by verified size, condition and availability', () => {
    expect(filterProducts(products, { ...DEFAULT_FILTERS, size: 'M' }).map((p) => p.id)).toEqual(['a'])
    expect(filterProducts(products, { ...DEFAULT_FILTERS, condition: 'Like new' }).map((p) => p.id)).toEqual(['b'])
    expect(filterProducts(products, { ...DEFAULT_FILTERS, availability: 'available' }).map((p) => p.id)).toEqual(['a', 'c'])
  })
  it('sorts by price and name', () => {
    expect(sortProducts(products, 'price-asc').map((p) => p.id)).toEqual(['b', 'c', 'a'])
    expect(sortProducts(products, 'price-desc').map((p) => p.id)).toEqual(['a', 'c', 'b'])
    expect(sortProducts(products, 'name').map((p) => p.name)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })
  it('only offers verified filter options', () => {
    expect(verifiedOptions(products, 'size')).toEqual(['L', 'M'])
  })
  it('hides archived products from the storefront', () => {
    expect(storefrontProducts([...products, make({ id: 'z', status: 'archived' })])).toHaveLength(3)
  })
})
