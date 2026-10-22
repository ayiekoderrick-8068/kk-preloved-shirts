import { Link } from 'react-router-dom'
import { config, hasWhatsApp } from '../lib/config'
import { cardStatus, priceLabel } from '../lib/inventory'
import { buildAvailabilityUrl } from '../lib/order'
import type { Product } from '../types'
import ProductImage from './ProductImage'

interface Props {
  product: Product
  onQuickView: (p: Product) => void
}

export default function ProductCard({ product: p, onQuickView }: Props) {
  const status = cardStatus(p)
  const sold = status.kind === 'sold'
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
          {status.kind === 'check' && hasWhatsApp ? (
            <a
              className="avail-link"
              href={buildAvailabilityUrl(config.whatsappNumber, p, config.storeName, config.siteUrl || window.location.origin)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Check availability of ${p.name} on WhatsApp (opens in a new tab)`}
            >
              {status.label}
            </a>
          ) : (
            <span className={`avail-text${sold ? ' is-sold-text' : ''}`}>{status.kind === 'check' ? 'Check availability with the shop' : status.label}</span>
          )}
        </div>
        <span className="price">{priceLabel(p)}</span>
      </div>
      <button type="button" className="quick-btn" onClick={() => onQuickView(p)}>
        Quick view
      </button>
    </article>
  )
}
