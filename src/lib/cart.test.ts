import { describe, expect, it } from 'vitest'
import { SEED_PRODUCTS } from '../data/seed'
import type { Product } from '../types'
import { addLine, cartCount, cartSubtotal, parseStoredCart, reconcileCart, removeLine, setLineQty, unpricedCount } from './cart'

const one: Product = { ...SEED_PRODUCTS[0], priceKes: 1500 }
const two: Product = { ...SEED_PRODUCTS[1], priceKes: 1800 }
const multi: Product = { ...SEED_PRODUCTS[2], quantity: 3 }
const sold: Product = { ...SEED_PRODUCTS[3], status: 'sold' }

describe('cart', () => {
  it('adds an item and refuses a second unit of a one-off piece', () => {
    const a = addLine([], one)
    expect(a.lines).toEqual([{ productId: one.id, qty: 1 }])
    const b = addLine(a.lines, one)
    expect(b.error).toBeTruthy()
    expect(b.lines).toEqual(a.lines)
  })
  it('refuses sold items', () => {
    expect(addLine([], sold).error).toBeTruthy()
  })
  it('limits quantity to verified stock', () => {
    let lines = addLine([], multi).lines
    lines = setLineQty(lines, multi, 3).lines
    expect(lines[0].qty).toBe(3)
    expect(setLineQty(lines, multi, 4).error).toBeTruthy()
  })
  it('removes lines and computes totals', () => {
    let lines = addLine([], one).lines
    lines = addLine(lines, two).lines
    expect(cartCount(lines)).toBe(2)
    expect(cartSubtotal(lines, [one, two])).toBe(3300)
    expect(removeLine(lines, one.id)).toHaveLength(1)
  })
  it('counts unpriced lines separately and keeps them out of the subtotal', () => {
    const unpriced: Product = { ...SEED_PRODUCTS[4], priceKes: null }
    const lines = [
      { productId: one.id, qty: 1 },
      { productId: unpriced.id, qty: 1 },
    ]
    expect(cartSubtotal(lines, [one, unpriced])).toBe(1500)
    expect(unpricedCount(lines, [one, unpriced])).toBe(1)
  })
  it('reconciles stale, sold and over-quantity lines', () => {
    const lines = [
      { productId: one.id, qty: 1 },
      { productId: 'gone', qty: 1 },
      { productId: sold.id, qty: 1 },
      { productId: multi.id, qty: 5 },
    ]
    const r = reconcileCart(lines, [one, sold, multi])
    expect(r.lines).toEqual([
      { productId: one.id, qty: 1 },
      { productId: multi.id, qty: 3 },
    ])
    expect(r.removed).toHaveLength(2)
    expect(r.adjusted).toEqual([multi.name])
  })
  it('ignores corrupt storage', () => {
    expect(parseStoredCart('not json')).toEqual([])
    expect(parseStoredCart('{"a":1}')).toEqual([])
    expect(parseStoredCart('[{"productId":"x","qty":0},{"productId":"y","qty":2}]')).toEqual([{ productId: 'y', qty: 2 }])
  })
})
