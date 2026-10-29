import { describe, expect, it } from 'vitest'
import { SEED_PRODUCTS } from '../data/seed'
import type { Product } from '../types'
import { fitWithin, srcSetFor, variantUrl } from './images'
import { canAddToBag, cardStatus, isNewArrival, maxQuantity, newArrivals, priceLabel, sortProducts, stockState, storefrontProducts, wasPrice } from './inventory'
import { cartTotals, isStandardPrice, singlePrice } from './pricing'
import { DEFAULT_SETTINGS, mergeSettings, whatsappLink } from './settings'

const base = SEED_PRODUCTS[0]
const make = (over: Partial<Product>): Product => ({ ...base, ...over })
const NOW = new Date('2026-11-10T12:00:00Z').getTime()
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString()

describe('statuses', () => {
  it('hides drafts and archived items from the storefront', () => {
    const list = [make({ id: 'a' }), make({ id: 'd', status: 'draft' }), make({ id: 'x', status: 'archived' }), make({ id: 'r', status: 'reserved' }), make({ id: 's', status: 'sold' })]
    expect(storefrontProducts(list).map((p) => p.id)).toEqual(['a', 'r', 's'])
  })
  it('reserved items are shown but cannot be bagged', () => {
    const p = make({ status: 'reserved', quantity: 1 })
    expect(stockState(p)).toBe('reserved')
    expect(maxQuantity(p)).toBe(0)
    expect(canAddToBag(p)).toBe(false)
    expect(cardStatus(p)).toEqual({ kind: 'reserved', label: 'Reserved' })
  })
  it('drafts can never be bagged', () => {
    expect(canAddToBag(make({ status: 'draft', quantity: 3 }))).toBe(false)
  })
  it('quantity 0 or Sold out status shows as sold out', () => {
    expect(stockState(make({ quantity: 0 }))).toBe('sold')
    expect(stockState(make({ status: 'sold', quantity: 4 }))).toBe('sold')
  })
})

describe('new arrivals', () => {
  it('uses the publication date, within 30 days', () => {
    expect(isNewArrival(make({ publishedAt: daysAgo(3) }), NOW)).toBe(true)
    expect(isNewArrival(make({ publishedAt: daysAgo(29) }), NOW)).toBe(true)
    expect(isNewArrival(make({ publishedAt: daysAgo(31) }), NOW)).toBe(false)
    expect(isNewArrival(make({ publishedAt: null }), NOW)).toBe(false)
  })
  it('honours the owner flag, but never for sold, draft or archived items', () => {
    expect(isNewArrival(make({ publishedAt: null, newArrival: true }), NOW)).toBe(true)
    for (const status of ['sold', 'draft', 'archived'] as const) expect(isNewArrival(make({ newArrival: true, status }), NOW)).toBe(false)
  })
  it('lists newest first and skips sold-out pieces', () => {
    const list = [
      make({ id: 'old', publishedAt: daysAgo(10) }),
      make({ id: 'new', publishedAt: daysAgo(1) }),
      make({ id: 'gone', publishedAt: daysAgo(2), status: 'sold' }),
      make({ id: 'ancient', publishedAt: daysAgo(90) }),
    ]
    expect(newArrivals(list, NOW).map((p) => p.id)).toEqual(['new', 'old'])
    expect(newArrivals(list, NOW, 1).map((p) => p.id)).toEqual(['new'])
  })
  it('sorts newest first by publish date', () => {
    const list = [make({ id: 'a', publishedAt: daysAgo(5) }), make({ id: 'b', publishedAt: daysAgo(1) })]
    expect(sortProducts(list, 'newest').map((p) => p.id)).toEqual(['b', 'a'])
  })
})

describe('discount pricing', () => {
  it('charges the discount price and shows the original as the was-price', () => {
    const p = make({ priceKes: 1500, discountPriceKes: 1200 })
    expect(singlePrice(p)).toBe(1200)
    expect(priceLabel(p)).toBe('KES 1,200')
    expect(wasPrice(p)).toBe(1500)
    expect(wasPrice(make({ priceKes: 1500, originalPriceKes: 2000, discountPriceKes: 1200 }))).toBe(2000)
    expect(wasPrice(make({ priceKes: 1500 }))).toBeNull()
  })
  it('an item with its own price is outside the pair deal, using the discount in the bag total', () => {
    const p = make({ id: 'own', priceKes: 1500, discountPriceKes: 1200 })
    expect(isStandardPrice(p)).toBe(false)
    expect(cartTotals([{ productId: 'own', qty: 1 }], [p]).subtotal).toBe(1200)
  })
})

describe('responsive images', () => {
  it('derives smaller variants for uploaded photos only', () => {
    const url = 'https://x.supabase.co/storage/v1/object/public/product-images/products/abc-1600.webp'
    expect(variantUrl(url, 480)).toBe(url.replace('-1600', '-480'))
    expect(srcSetFor(url)).toBe(`${variantUrl(url, 480)} 480w, ${variantUrl(url, 960)} 960w, ${url} 1600w`)
  })
  it('leaves seed photos and external links alone', () => {
    expect(srcSetFor('/assets/products/p-002.webp')).toBeUndefined()
    expect(variantUrl('https://example.com/photo.jpg', 480)).toBe('https://example.com/photo.jpg')
  })
  it('scales down without distorting and never upscales', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 })
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 })
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })
})

describe('shop settings', () => {
  it('uses defaults for blank fields and the owner values otherwise', () => {
    const merged = mergeSettings({ shopName: 'Kendy Thrift Shop', slogan: ' Dress well ', logoUrl: '', instagramUrl: 'https://www.instagram.com/k' })
    expect(merged.shopName).toBe('Kendy Thrift Shop')
    expect(merged.slogan).toBe(' Dress well ')
    expect(merged.logoUrl).toBe(DEFAULT_SETTINGS.logoUrl)
    expect(merged.instagramUrl).toBe('https://www.instagram.com/k')
  })
  it('uses the owner-supplied slogan and social links, and invents no announcement', () => {
    expect(DEFAULT_SETTINGS.slogan).toBe('We scour the best thrifts')
    expect(DEFAULT_SETTINGS.instagramUrl).toBe('https://www.instagram.com/k.kpre_loved_shirts')
    expect(DEFAULT_SETTINGS.tiktokUrl).toBe('https://www.tiktok.com/@k.kpre_loved_shirts')
    expect(DEFAULT_SETTINGS.announcement).toBe('')
  })
  it('owner-supplied social links pass the same validation the database enforces', () => {
    expect(DEFAULT_SETTINGS.instagramUrl).toMatch(/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._/-]+\/?$/i)
    expect(DEFAULT_SETTINGS.tiktokUrl).toMatch(/^https:\/\/(www\.|vm\.)?tiktok\.com\/[A-Za-z0-9@._/-]+\/?$/i)
  })
  it('builds the wa.me link only from a real number', () => {
    expect(whatsappLink('254712345678')).toBe('https://wa.me/254712345678')
    expect(whatsappLink('')).toBe('')
    expect(whatsappLink('82')).toBe('')
  })
})
