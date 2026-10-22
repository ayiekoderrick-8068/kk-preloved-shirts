import { describe, expect, it } from 'vitest'
import { SEED_PRODUCTS } from '../data/seed'
import type { Product } from '../types'
import { cartTotals, pairDealText, standardTotal } from './pricing'

describe('standardTotal (KES 350 each, any 2 for KES 600)', () => {
  it.each([
    [0, 0],
    [1, 350],
    [2, 600],
    [3, 950],
    [4, 1200],
    [5, 1550],
  ])('%i shirts cost %i', (n, total) => expect(standardTotal(n)).toBe(total))
})

describe('cartTotals', () => {
  const [a, b, c] = SEED_PRODUCTS
  const line = (p: Product, qty = 1) => ({ productId: p.id, qty })

  it('reports savings for a pair', () => {
    expect(cartTotals([line(a), line(b)], SEED_PRODUCTS)).toEqual({ subtotal: 600, standardCount: 2, savings: 100 })
  })
  it('charges a product with its own price at that price, outside the pair deal', () => {
    const special: Product = { ...c, priceKes: 1000 }
    const t = cartTotals([line(a), line(b), line(special)], [a, b, special])
    expect(t.subtotal).toBe(1600)
    expect(t.standardCount).toBe(2)
  })
  it('describes the deal for the UI', () => {
    expect(pairDealText()).toBe('Any 2 shirts for KES 600 (single shirt KES 350)')
  })
})
