import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { stockState } from '../lib/inventory'
import { isStandardPrice, pairDealText } from '../lib/pricing'
import type { Product } from '../types'
import AddToBagButton from './AddToBagButton'
import Modal from './Modal'
import PriceBlock from './PriceBlock'
import ProductImage from './ProductImage'
import ProductSpecs from './ProductSpecs'
import WhatsAppButton from './WhatsAppButton'

interface Props {
  product: Product | null
  onClose: () => void
}

export default function QuickView({ product: p, onClose }: Props) {
  const { isOpen: bagOpen } = useCart()
  // Opening the bag (e.g. from the toast's "View bag") replaces the quick view instead of stacking on it.
  useEffect(() => {
    if (bagOpen && p) onClose()
  }, [bagOpen, p, onClose])

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
            <PriceBlock product={p} />
            {isStandardPrice(p) && <p className="deal">{pairDealText()}</p>}
            {p.description && <p>{p.description}</p>}
            <ProductSpecs product={p} />
            <AddToBagButton product={p} />
            {stockState(p) !== 'sold' && <WhatsAppButton product={p} className="whatsapp-btn secondary-style" />}
            <Link to={`/shop/${p.id}`} className="text-link" onClick={onClose}>
              View full details
            </Link>
          </div>
        </>
      )}
    </Modal>
  )
}
