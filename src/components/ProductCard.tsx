import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { cardStatus, isNewArrival, priceLabel, wasPrice, formatKes } from '../lib/inventory'
import { buildAvailabilityUrl } from '../lib/order'
import { logInquiry } from '../lib/shopRepo'
import type { Product } from '../types'
import ProductImage from './ProductImage'

interface Props {
  product: Product
  onQuickView: (p: Product) => void
  /** First row of a page: load the main photo right away instead of lazily. */
  priority?: boolean
}

const CARD_SIZES = '(max-width: 760px) 50vw, (max-width: 1050px) 33vw, 25vw'

export default function ProductCard({ product: p, onQuickView, priority }: Props) {
  const { settings, hasWhatsApp, siteOrigin } = useSettings()
  const status = cardStatus(p)
  const unavailable = status.kind === 'sold' || status.kind === 'reserved'
  const was = wasPrice(p)
  const badge = status.kind === 'sold' ? 'Sold out' : status.kind === 'reserved' ? 'Reserved' : isNewArrival(p) ? 'New arrival' : null
  return (
    <article className={`product${unavailable ? ' is-sold' : ''}`}>
      <Link to={`/shop/${p.id}`} className="product-visual" aria-label={`${p.name}, ${priceLabel(p)}`}>
        {badge && <span className={`tag${badge === 'New arrival' ? ' tag-new' : ''}`}>{badge}</span>}
        <ProductImage src={p.images[0]} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} sizes={CARD_SIZES} />
        {p.images[1] && <ProductImage className="alt-photo" src={p.images[1]} alt="" loading="lazy" sizes={CARD_SIZES} />}
      </Link>
      <div className="product-meta">
        <div>
          <Link to={`/shop/${p.id}`} className="product-name">
            {p.name}
          </Link>
          <div className="product-kind">
            {p.size ? `Size ${p.size}` : 'Size to confirm'} · {p.condition ?? 'Condition to confirm'}
          </div>
          {status.kind === 'check' && hasWhatsApp ? (
            <a
              className="avail-link"
              href={buildAvailabilityUrl(settings.whatsappNumber, p, settings.shopName, siteOrigin)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Check availability of ${p.name} on WhatsApp (opens in a new tab)`}
              onClick={() => logInquiry(p, 'product-inquiry')}
            >
              {status.label}
            </a>
          ) : (
            <span className={`avail-text${unavailable ? ' is-sold-text' : ''}`}>{status.kind === 'check' ? 'Check availability with the shop' : status.label}</span>
          )}
        </div>
        <span className="price">
          {was !== null && <s className="was">{formatKes(was)}</s>}
          {priceLabel(p)}
        </span>
      </div>
      <button type="button" className="quick-btn" onClick={() => onQuickView(p)}>
        Quick view
      </button>
    </article>
  )
}
