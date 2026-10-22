import { Link } from 'react-router-dom'
import { priceLabel, stockState } from '../lib/inventory'
import type { Product } from '../types'
import ProductImage from './ProductImage'
import StockBadge from './StockBadge'

interface Props {
  product: Product
  onQuickView: (p: Product) => void
}

export default function ProductCard({ product: p, onQuickView }: Props) {
  const sold = stockState(p) === 'sold'
  return (
    <article className={`product${sold ? ' is-sold' : ''}`}>
      <Link to={`/shop/${p.id}`} className="product-visual" aria-label={`${p.name}, ${priceLabel(p)}`}>
        {sold && <span className="tag">Sold</span>}
        <ProductImage src={p.images[0]} alt="" loading="lazy" />
      </Link>
      <div className="product-meta">
        <div>
          <Link to={`/shop/${p.id}`} className="product-name">
            {p.name}
          </Link>
          <div className="product-kind">
            {p.category} · {p.size ? `Size ${p.size}` : 'Size to confirm'}
          </div>
          <StockBadge product={p} />
        </div>
        <span className={`price${p.priceKes === null ? ' tbc' : ''}`}>{priceLabel(p)}</span>
      </div>
      <button type="button" className="quick-btn" onClick={() => onQuickView(p)}>
        Quick view
      </button>
    </article>
  )
}
