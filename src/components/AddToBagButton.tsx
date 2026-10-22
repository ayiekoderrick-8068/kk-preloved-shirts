import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { canAddToBag } from '../lib/inventory'
import type { Product } from '../types'

/**
 * Adds to the bag and confirms with a corner toast ("Added to bag" + "View bag"). It never opens the bag
 * on its own and never renders a banner, so a product modal underneath stays clean.
 */
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
  // One-off pieces can only be added once: show the settled state in place, same size as the button.
  if (inBag(product.id) && (product.quantity ?? 1) <= 1) {
    return (
      <button type="button" className={`${className} is-added`} disabled>
        <span aria-hidden="true">✓</span> Added to bag
      </button>
    )
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (add(product)) notify('Added to bag', { label: 'View bag', onClick: openCart })
      }}
    >
      Add to bag <span aria-hidden="true">↗</span>
    </button>
  )
}
