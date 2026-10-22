import { stockLabel, stockState } from '../lib/inventory'
import type { Product } from '../types'

export default function StockBadge({ product }: { product: Product }) {
  return <span className={`stock stock-${stockState(product)}`}>{stockLabel(product)}</span>
}
