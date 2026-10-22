export type Category = 'Short sleeve' | 'Long sleeve'
export type Condition = 'Like new' | 'Very good' | 'Good' | 'Fair'
export type ProductStatus = 'available' | 'sold' | 'archived'

/** Customer-facing stock state, derived from status + verified quantity. */
export type StockState = 'in_stock' | 'unconfirmed' | 'sold'

export interface Measurements {
  /** All values in centimetres, laid flat. */
  chest?: number
  length?: number
  shoulder?: number
  sleeve?: number
}

export interface Product {
  id: string
  sku: string
  name: string
  category: Category
  description: string
  /** Price in KES. null = not yet confirmed by the shop (shown as "Price to confirm"). */
  priceKes: number | null
  /** Verified garment size (e.g. "M", "L", "42"). null = not yet verified by the shop. */
  size: string | null
  measurements: Measurements | null
  condition: Condition | null
  /** Disclosed flaws. null = not yet inspected, '' = inspected, none found. */
  flaws: string | null
  /** Verified units in stock. null = not yet verified. */
  quantity: number | null
  status: ProductStatus
  /** Image paths/URLs, first is the primary image. Only real photos. */
  images: string[]
  tag?: string
  featured: boolean
  createdAt: string
  updatedAt: string
}

export interface CartLine {
  productId: string
  qty: number
}

export interface CustomerDetails {
  fullName: string
  phone: string
  fulfillment: 'Delivery' | 'Pickup'
  location: string
  notes: string
  consent: boolean
}
