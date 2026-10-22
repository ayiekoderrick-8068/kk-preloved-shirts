import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { canAddToBag } from '../lib/inventory'
import type { Product } from '../types'

export default function AddToBagButton({ product, className = 'primary full' }: { product: Product; className?: string }) {
  const { add, inBag, openCart } = useCart()
  const notify = useToast()

  if (!canAddToBag(product)) {
    return (
      <button type="button" className={className} disabled>
        Sold out
      </button>
    )
  }
  if (inBag(product.id) && (product.quantity ?? 1) <= 1) {
    return (
      <button type="button" className={className} onClick={openCart}>
        In your bag - view bag
      </button>
    )
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (add(product)) {
          notify(`${product.name} added to your bag`)
          openCart()
        }
      }}
    >
      Add to bag <span aria-hidden="true">↗</span>
    </button>
  )
}
