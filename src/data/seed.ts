import type { Category, Product } from '../types'

/**
 * Seed inventory: the 19 photographed shirts from the original prototype.
 *
 * VERIFIED   : the photo, the working name and the category / listed price carried over from the prototype.
 * UNVERIFIED : size, measurements, condition, flaws and stock quantity are all null.
 *              The storefront shows "Details to confirm" for these - nothing is guessed.
 * The shop must confirm each row (see LAUNCH_CHECKLIST.md) via the admin area or the database.
 */
const SEED_DATE = '2026-10-22T00:00:00.000Z'

type Row = [n: number, name: string, category: Category, price: number, description: string, tag?: string]

const ROWS: Row[] = [
  [1, 'Sky Blue Camp Shirt', 'Short sleeve', 1500, 'Camp collar, textured weave and an embroidered chest logo.', 'Popular'],
  [2, 'Black Long-Sleeve Shirt', 'Long sleeve', 1800, 'Hidden placket, chest pocket and tonal embroidery.'],
  [3, 'Crinkle Camp Shirt', 'Short sleeve', 1200, 'Camp collar, patch pocket and a soft crinkled cotton finish.', 'New in'],
  [4, 'Forest Flannel Shirt', 'Long sleeve', 1800, 'Two flap pockets, horn-style buttons and a brushed green flannel.', 'Popular'],
  [5, 'Dusty Rose Shirt', 'Short sleeve', 1200, 'Classic collar, chest pocket and a small yellow label at the hem.'],
  [6, 'Butterfly Panel Shirt', 'Short sleeve', 1500, 'Camp collar with a butterfly print band across the chest.', 'New in'],
  [7, 'Taupe Jacquard Shirt', 'Short sleeve', 1500, 'Tonal floral jacquard with vertical stripes and camp collar.'],
  [8, 'Abstract Print Shirt', 'Long sleeve', 2000, 'Painterly print in sand, blue and grey with aqua buttons.'],
  [9, 'White Seersucker Shirt', 'Short sleeve', 1200, 'Camp collar, chest pocket and light striped seersucker.', 'Popular'],
  [10, 'Black Hooded Shirt', 'Short sleeve', 1500, 'Lightweight hooded shirt with drawstrings and a half placket.'],
  [11, 'Tan Utility Shirt', 'Long sleeve', 1800, 'Two button-flap chest pockets and cuffs with a clean drape.'],
  [12, 'Grey Plaid Shirt', 'Short sleeve', 1500, 'Camp collar, soft plaid and a chest pocket with a small label.'],
  [13, 'Cream Long-Sleeve Shirt', 'Long sleeve', 1800, 'Lightly crinkled weave with a chest pocket and shell buttons.', 'New in'],
  [14, 'Black Utility Shirt', 'Long sleeve', 1800, 'Two chest pockets and a soft, garment-washed black cotton.'],
  [15, 'Cream Pocket Shirt', 'Short sleeve', 1200, 'Two flap pockets and a smooth, easy-hanging fabric.'],
  [16, 'Pale Blue Shirt', 'Short sleeve', 1200, 'Classic collar, chest pocket and a fine textured weave.'],
  [17, 'Ivory Linen Shirt', 'Short sleeve', 1500, 'Linen-look weave in ivory with a roomy chest pocket.'],
  [18, 'Sand Camp Shirt', 'Short sleeve', 1200, 'Camp collar and snap-style front in a light sand cotton.', 'New in'],
  [19, 'Ivory Stripe Shirt', 'Short sleeve', 1200, 'Tonal stripes, chest pocket and pearl-style buttons.'],
]

export const SEED_PRODUCTS: Product[] = ROWS.map(([n, name, category, priceKes, description]) => {
  // The prototype's "Bestseller / New in" badges were unverified marketing claims, so they are not carried over.
  const num = String(n).padStart(2, '0')
  return {
    id: `kk-${num}`,
    sku: `KK-${num}`,
    name,
    category,
    description,
    priceKes,
    size: null,
    measurements: null,
    condition: null,
    flaws: null,
    quantity: null,
    status: 'available',
    images: [`/assets/shirt-${num}.webp`],
    featured: [1, 4, 8, 13, 17, 6].includes(n),
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }
})
