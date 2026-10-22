import type { CartLine, Product } from '../types'
import { maxQuantity } from './inventory'

/** Bump the version suffix whenever the stored shape changes; old carts are then ignored. */
export const CART_STORAGE_KEY = 'kk-preloved-shirts:cart:v1'

export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter(
      (l): l is CartLine =>
        typeof l === 'object' &&
        l !== null &&
        typeof (l as CartLine).productId === 'string' &&
        Number.isInteger((l as CartLine).qty) &&
        (l as CartLine).qty > 0,
    )
  } catch {
    return []
  }
}

export interface CartResult {
  lines: CartLine[]
  error?: string
}

export function addLine(lines: CartLine[], product: Product, qty = 1): CartResult {
  const max = maxQuantity(product)
  if (max <= 0) return { lines, error: `${product.name} is sold out.` }
  const existing = lines.find((l) => l.productId === product.id)
  const next = (existing?.qty ?? 0) + qty
  if (next > max) {
    return {
      lines,
      error: max === 1 ? `${product.name} is a one-off piece and is already in your bag.` : `Only ${max} of ${product.name} available.`,
    }
  }
  return {
    lines: existing
      ? lines.map((l) => (l.productId === product.id ? { ...l, qty: next } : l))
      : [...lines, { productId: product.id, qty }],
  }
}

export function setLineQty(lines: CartLine[], product: Product, qty: number): CartResult {
  if (qty <= 0) return { lines: removeLine(lines, product.id) }
  const max = maxQuantity(product)
  if (qty > max) {
    return { lines, error: max <= 1 ? `${product.name} is a one-off piece.` : `Only ${max} of ${product.name} available.` }
  }
  return { lines: lines.map((l) => (l.productId === product.id ? { ...l, qty } : l)) }
}

export const removeLine = (lines: CartLine[], productId: string): CartLine[] => lines.filter((l) => l.productId !== productId)

export interface Reconciled {
  lines: CartLine[]
  /** Names of items dropped because they are gone, sold or archived. */
  removed: string[]
  /** Names of items whose quantity was lowered to the stock now available. */
  adjusted: string[]
}

/** Drops stale/unavailable lines and clamps quantities against current inventory. */
export function reconcileCart(lines: CartLine[], products: Product[]): Reconciled {
  const removed: string[] = []
  const adjusted: string[] = []
  const out: CartLine[] = []
  for (const l of lines) {
    const p = products.find((x) => x.id === l.productId)
    if (!p) {
      removed.push('An item that is no longer listed')
      continue
    }
    const max = maxQuantity(p)
    if (max <= 0) {
      removed.push(p.name)
      continue
    }
    if (l.qty > max) {
      adjusted.push(p.name)
      out.push({ ...l, qty: max })
    } else out.push(l)
  }
  return { lines: out, removed, adjusted }
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0)
}

/** Number of bag lines whose price the shop has not confirmed yet. */
export function unpricedCount(lines: CartLine[], products: Product[]): number {
  return lines.filter((l) => products.find((p) => p.id === l.productId)?.priceKes == null).length
}

/** Sum of confirmed prices only; unpriced lines contribute 0 (callers must say so). */
export function cartSubtotal(lines: CartLine[], products: Product[]): number {
  return lines.reduce((sum, l) => sum + (products.find((p) => p.id === l.productId)?.priceKes ?? 0) * l.qty, 0)
}
