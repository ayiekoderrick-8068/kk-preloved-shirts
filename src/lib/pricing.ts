import type { CartLine, Product } from '../types'

/**
 * Shop pricing: a standard shirt costs `unit`; every 2 standard shirts bought together cost `pair`.
 * With 3+ shirts each full pair is charged `pair` and a leftover single is charged `unit`
 * (assumption - confirm with the shop). A product with its own `priceKes` is charged that price
 * and is not part of the pair deal.
 */
export interface PricingRule {
  unit: number
  pair: number
}

export const DEFAULT_RULE: PricingRule = { unit: 350, pair: 600 }

export const isStandardPrice = (p: Pick<Product, 'priceKes'>): boolean => p.priceKes === null

/** Price of n standard shirts under the pair deal. */
export function standardTotal(n: number, rule: PricingRule = DEFAULT_RULE): number {
  return Math.floor(n / 2) * rule.pair + (n % 2) * rule.unit
}

export interface Totals {
  subtotal: number
  /** Count of standard-priced shirts in the bag. */
  standardCount: number
  /** KES saved by the pair deal versus buying each standard shirt at the single price. */
  savings: number
}

export function cartTotals(lines: CartLine[], products: Product[], rule: PricingRule = DEFAULT_RULE): Totals {
  let standardCount = 0
  let own = 0
  for (const l of lines) {
    const p = products.find((x) => x.id === l.productId)
    if (!p) continue
    if (isStandardPrice(p)) standardCount += l.qty
    else own += (p.priceKes ?? 0) * l.qty
  }
  const bundled = standardTotal(standardCount, rule)
  return { subtotal: own + bundled, standardCount, savings: standardCount * rule.unit - bundled }
}

/** e.g. "Any 2 shirts for KES 600 (single shirt KES 350)". */
export const pairDealText = (rule: PricingRule = DEFAULT_RULE): string =>
  `Any 2 shirts for KES ${rule.pair.toLocaleString('en-KE')} (single shirt KES ${rule.unit.toLocaleString('en-KE')})`

/** Price of one shirt as customers see it before any pair deal. */
export const singlePrice = (p: Pick<Product, 'priceKes'>, rule: PricingRule = DEFAULT_RULE): number => p.priceKes ?? rule.unit
