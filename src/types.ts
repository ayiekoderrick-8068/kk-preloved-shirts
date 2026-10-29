/** Category names are managed by the shop owner in the admin (table `categories`). */
export type Category = string
export type Condition = 'Like new' | 'Very good' | 'Good' | 'Fair'
/** draft = saved but not public; reserved = held for a customer; archived = hidden old listing. */
export type ProductStatus = 'draft' | 'available' | 'reserved' | 'sold' | 'archived'

/** Customer-facing stock state, derived from status + verified quantity. */
export type StockState = 'in_stock' | 'unconfirmed' | 'sold' | 'reserved'

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
  /** Own price in KES. null = the shop's standard price and pair deal (see lib/pricing.ts). */
  priceKes: number | null
  /** Optional "was" price shown struck through when a discount price is set. */
  originalPriceKes: number | null
  /** Optional sale price. When set it is the price customers pay. */
  discountPriceKes: number | null
  /** Verified garment size (e.g. "M", "L", "42"). null = not yet verified by the shop. */
  size: string | null
  color: string | null
  brand: string | null
  measurements: Measurements | null
  condition: Condition | null
  /** Disclosed flaws. null = not yet inspected, '' = inspected, none found. */
  flaws: string | null
  /** Extra garment details (fabric, fit, care...). */
  details: string | null
  /** Verified units in stock. null = not yet verified. */
  quantity: number | null
  status: ProductStatus
  /** Image paths/URLs, first is the primary image. Only real photos. */
  images: string[]
  tag?: string
  featured: boolean
  /** Owner-set flag that forces the "New arrival" badge regardless of date. */
  newArrival: boolean
  /** When the product first went public. null for drafts and for items listed before dates were tracked. */
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CategoryItem {
  id: string
  name: string
  sortOrder: number
}

/** Public shop details editable by the owner (table `shop_settings`). Blank = not set. */
export interface ShopSettings {
  shopName: string
  slogan: string
  logoUrl: string
  /** Digits with country code, e.g. 254712345678. The wa.me link is generated from it. */
  whatsappNumber: string
  instagramUrl: string
  tiktokUrl: string
  contactEmail: string
  contactPhone: string
  announcement: string
  description: string
}

export interface Inquiry {
  id: string
  productId: string | null
  productName: string
  sku: string
  channel: 'product-inquiry' | 'order-request'
  handled: boolean
  createdAt: string
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
