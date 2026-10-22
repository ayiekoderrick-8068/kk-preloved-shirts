import { describe, expect, it } from 'vitest'
import { SEED_PRODUCTS } from '../data/seed'
import type { CustomerDetails } from '../types'
import { buildOrderMessage, buildWhatsAppUrl, normalizePhone, validateCustomer } from './order'

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
    const msg = buildOrderMessage(lines, priced, customer, 'KK Pre-Loved Shirts')
    expect(msg).toContain('Butterfly Print Camp Shirt [KK-01]')
    expect(msg).toContain('Size to confirm')
    expect(msg).toContain('KES 1,500')
    expect(msg).toContain('Delivery fee: to confirm')
    expect(msg).toContain('not a confirmed order')
  })
  it('never invents a price for unpriced items', () => {
    const msg = buildOrderMessage(lines, SEED_PRODUCTS, customer, 'KK Pre-Loved Shirts')
    expect(msg).toContain('Price to confirm')
    expect(msg).toContain('1 item(s) with price to confirm')
    expect(msg).not.toMatch(/KES [1-9]/)
  })
  it('url-encodes into a wa.me link', () => {
    const url = buildWhatsAppUrl('+254 712 345 678', 'Hi & bye\nline 2')
    expect(url).toBe('https://wa.me/254712345678?text=Hi%20%26%20bye%0Aline%202')
  })
})
