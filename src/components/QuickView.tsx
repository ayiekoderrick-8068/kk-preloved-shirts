import { Link } from 'react-router-dom'
import { priceLabel } from '../lib/inventory'
import type { Product } from '../types'
import AddToBagButton from './AddToBagButton'
import Modal from './Modal'
import ProductImage from './ProductImage'
import ProductSpecs from './ProductSpecs'

interface Props {
  product: Product | null
  onClose: () => void
}

export default function QuickView({ product: p, onClose }: Props) {
  return (
    <Modal open={p !== null} onClose={onClose} label={p ? `Quick view: ${p.name}` : 'Quick view'} variant="modal">
      {p && (
        <>
          <button type="button" className="detail-close" onClick={onClose} aria-label="Close quick view">
            ×
          </button>
          <div className="detail-picture">
            <ProductImage src={p.images[0]} alt={p.name} />
          </div>
          <div className="detail-info">
            <div className="eyebrow">{p.category}</div>
            <h2>{p.name}</h2>
            <div className={`price big${p.priceKes === null ? ' tbc' : ''}`}>{priceLabel(p)}</div>
            {p.description && <p>{p.description}</p>}
            <ProductSpecs product={p} />
            <AddToBagButton product={p} />
            <Link to={`/shop/${p.id}`} className="text-link" onClick={onClose}>
              View full details
            </Link>
          </div>
        </>
      )}
    </Modal>
  )
}
