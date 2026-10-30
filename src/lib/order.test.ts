import { describe, expect, it } from 'vitest'
import { SEED_PRODUCTS } from '../data/seed'
import type { CustomerDetails } from '../types'
import { buildAvailabilityUrl, buildOrderMessage, buildWhatsAppUrl, normalizePhone, validateCustomer } from './order'

const customer: CustomerDetails = {
  fullName: 'Jane Wanjiku',
  phone: '0712 345 678',
  fulfillment: 'Delivery',
  location: 'Kilimani, Nairobi',
  notes: '',
  consent: true,
}

describe('normalizePhone', () => {
  it.each([
    ['0712345678', '254712345678'],
    ['0112345678', '254112345678'],
    ['712345678', '254712345678'],
    ['+254 712 345 678', '254712345678'],
    ['254712345678', '254712345678'],
    ['+44 7700 900123', '447700900123'],
  ])('accepts %s', (input, out) => {
    expect(normalizePhone(input)).toEqual({ valid: true, normalized: out })
  })
  it.each(['', 'abc', '07123', '0812345678', '+1'])('rejects %s', (input) => {
    expect(normalizePhone(input).valid).toBe(false)
  })
})

describe('validateCustomer', () => {
  it('passes valid details', () => expect(validateCustomer(customer)).toEqual({}))
  it('requires name, phone, location and consent', () => {
    const e = validateCustomer({ ...customer, fullName: '', phone: '12', location: '', consent: false })
    expect(Object.keys(e).sort()).toEqual(['consent', 'fullName', 'location', 'phone'])
  })
})

describe('buildOrderMessage', () => {
  const lines = [{ productId: SEED_PRODUCTS[0].id, qty: 1 }]
  it('lists items, flags unconfirmed size, and states the delivery fee is to confirm', () => {
    const priced = SEED_PRODUCTS.map((p, i) => (i === 0 ? { ...p, priceKes: 1500 } : p))
    const msg = buildOrderMessage(lines, priced, customer, 'KK Preloved Shirts')
    expect(msg).toContain('Butterfly Print Camp Shirt [KK-01]')
    expect(msg).toContain('Size to confirm')
    expect(msg).toContain('KES 1,500')
    expect(msg).toContain('Items subtotal: KES 1,500')
    expect(msg).toContain('Delivery fee: to confirm')
    expect(msg).toContain('not a confirmed order')
  })
  it('uses the standard price and the pair deal for two shirts', () => {
    const two = [
      { productId: SEED_PRODUCTS[0].id, qty: 1 },
      { productId: SEED_PRODUCTS[1].id, qty: 1 },
    ]
    const msg = buildOrderMessage(two, SEED_PRODUCTS, customer, 'KK Preloved Shirts')
    expect(msg).toContain('KES 350')
    expect(msg).toContain('Items subtotal: KES 600 (pair deal applied, saving KES 100)')
    const one = buildOrderMessage(lines, SEED_PRODUCTS, customer, 'KK Preloved Shirts')
    expect(one).toContain('Items subtotal: KES 350')
    expect(one).not.toContain('pair deal')
  })
  it('builds an availability enquiry with the shirt name, SKU and page link', () => {
    const url = buildAvailabilityUrl('254782718496', SEED_PRODUCTS[0], 'KK Preloved Shirts', 'https://example.com/')
    expect(url.startsWith('https://wa.me/254782718496?text=')).toBe(true)
    const text = decodeURIComponent(url.split('?text=')[1])
    expect(text).toContain("Hello KK Preloved Shirts! I'm interested in Butterfly Print Camp Shirt, size to be confirmed, priced at KES 350. Is it still available?")
    expect(text).toContain('SKU: KK-01')
    expect(text).toContain('https://example.com/shop/kk-01')
  })
  it('builds the inquiry from the real product size and price, using the discount when set', () => {
    const p = { ...SEED_PRODUCTS[0], size: 'L', priceKes: 1500, discountPriceKes: 1200 }
    const text = decodeURIComponent(buildAvailabilityUrl('254712345678', p, 'Kendy Thrift Shop', 'https://example.com').split('?text=')[1])
    expect(text).toContain("Hello Kendy Thrift Shop! I'm interested in Butterfly Print Camp Shirt, size L, priced at KES 1,200.")
  })
  it('url-encodes into a wa.me link', () => {
    const url = buildWhatsAppUrl('+254 712 345 678', 'Hi & bye\nline 2')
    expect(url).toBe('https://wa.me/254712345678?text=Hi%20%26%20bye%0Aline%202')
  })
})
