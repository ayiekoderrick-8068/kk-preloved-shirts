import { formatKes, priceLabel, wasPrice } from '../lib/inventory'
import type { Product } from '../types'

/** Large price line for detail views: the price customers pay, with the struck-through original when discounted. */
export default function PriceBlock({ product: p }: { product: Product }) {
  const was = wasPrice(p)
  return (
    <div className="price big">
      {priceLabel(p)}
      {was !== null && (
        <>
          {' '}
          <s className="was" aria-label={`was ${formatKes(was)}`}>{formatKes(was)}</s>
        </>
      )}
    </div>
  )
}
