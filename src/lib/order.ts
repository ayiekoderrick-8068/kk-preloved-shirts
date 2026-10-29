import type { CartLine, CustomerDetails, Product } from '../types'
import { formatKes, priceLabel, stockState } from './inventory'
import { cartTotals } from './pricing'

export interface PhoneResult {
  valid: boolean
  /** Digits with country code, no plus sign (e.g. 254712345678). */
  normalized: string
}

/**
 * Accepts Kenyan formats (07XX, 01XX, 7XX, 2547XX, +2547XX) and any other international
 * number written with a leading + (or 00) and 8-15 digits.
 */
export function normalizePhone(input: string): PhoneResult {
  const trimmed = input.trim()
  if (!/^[+\d][\d\s()-]*$/.test(trimmed)) return { valid: false, normalized: '' }
  let digits = trimmed.replace(/\D/g, '')
  const international = trimmed.startsWith('+') || digits.startsWith('00')
  if (digits.startsWith('00')) digits = digits.slice(2)

  if (international) {
    if (digits.startsWith('254')) return kenya(digits.slice(3))
    return digits.length >= 8 && digits.length <= 15 ? { valid: true, normalized: digits } : { valid: false, normalized: '' }
  }
  if (digits.startsWith('254')) return kenya(digits.slice(3))
  if (digits.startsWith('0')) return kenya(digits.slice(1))
  return kenya(digits)
}

function kenya(national: string): PhoneResult {
  // Kenyan mobile/landline numbers are 9 digits after the country code, starting 1 or 7 for mobile.
  return /^[17]\d{8}$/.test(national) ? { valid: true, normalized: '254' + national } : { valid: false, normalized: '' }
}

export type CustomerErrors = Partial<Record<keyof CustomerDetails, string>>

export function validateCustomer(c: CustomerDetails): CustomerErrors {
  const e: CustomerErrors = {}
  if (c.fullName.trim().length < 2) e.fullName = 'Enter your full name.'
  if (!normalizePhone(c.phone).valid) e.phone = 'Enter a valid phone number, e.g. 0712 345 678 or +254712345678.'
  if (c.location.trim().length < 2) {
    e.location = c.fulfillment === 'Delivery' ? 'Enter your delivery town / estate.' : 'Enter the pickup area or note.'
  }
  if (!c.consent) e.consent = 'Please agree to share your order details with the shop via WhatsApp.'
  return e
}

export function buildOrderMessage(lines: CartLine[], products: Product[], c: CustomerDetails, storeName: string): string {
  const items = lines.flatMap((l, i) => {
    const p = products.find((x) => x.id === l.productId)
    if (!p) return []
    const stock = stockState(p) === 'in_stock' ? '' : ' (size/availability to confirm)'
    const size = p.size ? `Size ${p.size}` : 'Size to confirm'
    return [`${i + 1}. ${p.name} [${p.sku}] - ${size} - Qty ${l.qty} - ${priceLabel(p, l.qty)}${stock}`]
  })
  const notes = c.notes.trim()
  const totals = cartTotals(lines, products)
  return [
    `Hello ${storeName}, I would like to order:`,
    '',
    ...items,
    '',
    `Items subtotal: ${formatKes(totals.subtotal)}${totals.savings > 0 ? ` (pair deal applied, saving ${formatKes(totals.savings)})` : ''}`,
    c.fulfillment === 'Delivery' ? 'Delivery fee: to confirm' : 'Pickup: no delivery fee',
    '',
    `Name: ${c.fullName.trim()}`,
    `Phone: ${c.phone.trim()}`,
    `Method: ${c.fulfillment}`,
    `${c.fulfillment === 'Delivery' ? 'Delivery location' : 'Pickup note'}: ${c.location.trim()}`,
    ...(notes ? [`Notes: ${notes}`] : []),
    '',
    'Please confirm availability, size and the final total. This is a request, not a confirmed order.',
  ].join('\n')
}

type Inquirable = Pick<Product, 'id' | 'sku' | 'name' | 'size' | 'priceKes'> & Partial<Pick<Product, 'discountPriceKes'>>

/** Product inquiry text built from the product's own data: name, size, price, SKU and page link. */
export function buildInquiryMessage(product: Inquirable, storeName: string, siteOrigin: string): string {
  return [
    `Hello ${storeName}! I'm interested in ${product.name}, size ${product.size ?? 'to be confirmed'}, priced at ${priceLabel(product)}. Is it still available?`,
    '',
    `SKU: ${product.sku}`,
    `${siteOrigin.replace(/\/$/, '')}/shop/${product.id}`,
  ].join('\n')
}

/** WhatsApp link asking the shop whether one specific item is still available. Opening it never changes stock. */
export function buildAvailabilityUrl(number: string, product: Inquirable, storeName: string, siteOrigin: string): string {
  return buildWhatsAppUrl(number, buildInquiryMessage(product, storeName, siteOrigin))
}

export const buildWhatsAppUrl =(number: string, message: string): string =>
  `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
