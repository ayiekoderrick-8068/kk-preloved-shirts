import { describe, expect, it } from 'vitest'
import { SEED_PRODUCTS } from '../data/seed'
import type { Product, ShopSettings } from '../types'
import { DEFAULT_SETTINGS } from './settings'
import { parseWhatsApp, validateProduct, validateSettings } from './validate'

const categories = ['Short sleeve', 'Long sleeve']
const complete: Product = {
  ...SEED_PRODUCTS[0],
  id: 'new-1',
  sku: 'KS-01',
  name: 'Navy Oxford Shirt',
  category: 'Long sleeve',
  description: 'Crisp navy Oxford shirt, button-down collar.',
  priceKes: 1500,
  size: 'M',
  color: 'Navy',
  condition: 'Very good',
  quantity: 1,
  images: ['https://example.com/a-1600.webp'],
}
const check = (over: Partial<Product>, others: Pick<Product, 'id' | 'sku'>[] = []) => validateProduct({ ...complete, ...over }, { categories, others })

describe('validateProduct', () => {
  it('accepts a complete product', () => {
    expect(check({})).toEqual({})
  })
  it('requires every publish field', () => {
    const e = check({ name: '', category: '', priceKes: null, size: null, color: null, condition: null, quantity: null, description: '', images: [] })
    for (const k of ['name', 'category', 'priceKes', 'size', 'color', 'condition', 'quantity', 'description', 'images']) expect(e).toHaveProperty(k)
  })
  it('lets a draft be saved with only a name and SKU', () => {
    expect(check({ status: 'draft', category: '', priceKes: null, size: null, color: null, condition: null, quantity: null, description: '', images: [] })).toEqual({})
    expect(check({ status: 'draft', name: '' })).toHaveProperty('name')
  })
  it('never allows negative or fractional quantities', () => {
    expect(check({ quantity: -1 })).toHaveProperty('quantity')
    expect(check({ quantity: 1.5 })).toHaveProperty('quantity')
    expect(check({ quantity: 0 })).toEqual({})
  })
  it('rejects bad prices', () => {
    expect(check({ priceKes: 0 })).toHaveProperty('priceKes')
    expect(check({ priceKes: -5 })).toHaveProperty('priceKes')
    expect(check({ priceKes: 12.5 })).toHaveProperty('priceKes')
  })
  it('keeps discount below the selling price and original above it', () => {
    expect(check({ discountPriceKes: 1200 })).toEqual({})
    expect(check({ discountPriceKes: 1500 })).toHaveProperty('discountPriceKes')
    expect(check({ discountPriceKes: 1800 })).toHaveProperty('discountPriceKes')
    expect(check({ originalPriceKes: 2000 })).toEqual({})
    expect(check({ originalPriceKes: 1000 })).toHaveProperty('originalPriceKes')
  })
  it('rejects a SKU another product already uses (case-insensitive) but not its own', () => {
    expect(check({}, [{ id: 'other', sku: 'ks-01' }])).toHaveProperty('sku')
    expect(check({}, [{ id: 'new-1', sku: 'KS-01' }])).toEqual({})
    expect(check({ sku: 'bad sku!' })).toHaveProperty('sku')
  })
  it('rejects unsafe image links', () => {
    expect(check({ images: ['javascript:alert(1)'] })).toHaveProperty('images')
    expect(check({ images: ['http://example.com/a.jpg'] })).toHaveProperty('images')
  })
})

describe('parseWhatsApp', () => {
  it('accepts local, international and wa.me forms', () => {
    expect(parseWhatsApp('0712 345 678')).toBe('254712345678')
    expect(parseWhatsApp('+254 712 345 678')).toBe('254712345678')
    expect(parseWhatsApp('https://wa.me/254712345678')).toBe('254712345678')
    expect(parseWhatsApp('https://wa.me/254712345678?text=hi')).toBe('254712345678')
    expect(parseWhatsApp('https://api.whatsapp.com/send?phone=254712345678')).toBe('254712345678')
  })
  it('rejects anything else, including look-alike hosts and partial numbers', () => {
    expect(parseWhatsApp('')).toBe('')
    expect(parseWhatsApp('82')).toBe('')
    expect(parseWhatsApp('https://evil.example/wa.me/254712345678')).toBe('')
    expect(parseWhatsApp('http://wa.me/254712345678')).toBe('')
    expect(parseWhatsApp('call me')).toBe('')
  })
})

describe('validateSettings', () => {
  const ok: ShopSettings = { ...DEFAULT_SETTINGS, instagramUrl: 'https://www.instagram.com/some.shop', tiktokUrl: 'https://www.tiktok.com/@some.shop', contactEmail: 'a@b.co' }
  it('accepts valid links', () => {
    expect(validateSettings(ok, '0712345678')).toEqual({})
  })
  it('allows blanks for optional fields, including the slogan', () => {
    expect(validateSettings({ ...ok, slogan: '', instagramUrl: '', tiktokUrl: '', contactEmail: '' }, '')).toEqual({})
  })
  it('validates URLs, email and WhatsApp before saving', () => {
    const e = validateSettings({ ...ok, instagramUrl: 'instagram.com/x', tiktokUrl: 'https://example.com/@x', contactEmail: 'nope', logoUrl: 'javascript:1' }, '123')
    expect(Object.keys(e).sort()).toEqual(['contactEmail', 'instagramUrl', 'logoUrl', 'tiktokUrl', 'whatsappNumber'])
  })
  it('requires a shop name', () => {
    expect(validateSettings({ ...ok, shopName: ' ' }, '')).toHaveProperty('shopName')
  })
})
