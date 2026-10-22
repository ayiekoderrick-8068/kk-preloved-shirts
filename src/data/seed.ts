import type { Category, Product } from '../types'

/**
 * Seed inventory built from the shop's own photos (public/assets/products/p-NNN.webp, where NNN is the
 * original photo number). Photos were grouped per garment by eye from contact sheets, so a grouping may
 * be wrong: check each product's photos in the admin area before launch.
 *
 * VERIFIED   : the photos themselves, and the sleeve length visible in them.
 * UNVERIFIED : name (a plain description of what the photo shows), price, size, measurements, condition,
 *              flaws and stock are all unknown (null) and shown as "to confirm" in the storefront.
 *              Nothing is guessed. The shop must confirm each row (see LAUNCH_CHECKLIST.md).
 *
 * The original 19 cut-out images from the prototype (public/assets/shirt-NN.webp) are preserved but no longer
 * used, because the cut-outs were of unnamed shirts that cannot be matched to these products reliably.
 */
const SEED_DATE = '2026-10-22T00:00:00.000Z'

type Row = [name: string, category: Category, photos: number[], featured?: boolean]

const S: Category = 'Short sleeve'
const L: Category = 'Long sleeve'

// A trailing `true` marks a shirt for the home-page spotlight: the most colourful, best-lit shots.
// The collage shirts (see lib/home.ts) must not also be flagged.
const ROWS: Row[] = [
  ['Butterfly Print Camp Shirt', S, [80, 81, 131, 132], true],
  ['Cream Camp Shirt with Coconut Buttons', S, [78, 79, 152, 153]],
  ['White Palm-Print Camp Shirt', S, [92, 93, 135, 136]],
  ['Blue Hibiscus Print Shirt', S, [96, 97, 137, 138], true],
  ['Dusty Pink Short-Sleeve Shirt', S, [94, 95, 139, 140]],
  ['Grey Hooded Short-Sleeve Shirt', S, [109, 110, 143, 144]],
  ['Rust Orange Two-Pocket Shirt', S, [89, 90], true],
  ['Teal Blue Two-Pocket Shirt', S, [103, 104, 141, 142], true],
  ['Blue i9 Sports Camp Shirt', S, [98, 125]],
  ['White and Black Panel Camp Shirt', S, [105, 106, 41]],
  ['Silver Pinstripe Camp Shirt', S, [113, 114, 123]],
  ['White Textured Short-Sleeve Shirt', S, [107, 108, 127, 128]],
  ['Beige Half-Zip Shirt', S, [99, 100, 133, 134]],
  ['Cream Linen-Look Pocket Shirt', S, [117, 118, 129, 130, 154]],
  ['Black Short-Sleeve Camp Shirt', S, [86, 87, 122]],
  ['Slate Blue Short-Sleeve Shirt', S, [91]],
  ['Beige Short-Sleeve Shirt', S, [84, 85]],
  ['Black Two-Pocket Long-Sleeve Shirt', L, [101, 102, 148, 149]],
  ['Dark Green Two-Pocket Long-Sleeve Shirt', L, [119, 120, 126]],
  ['Beige Two-Pocket Long-Sleeve Shirt', L, [115, 116, 124]],
  ['White French-Cuff Shirt', L, [111, 112, 145, 146]],
  ['Cream Long-Sleeve Camp Shirt', L, [82, 83, 150, 151]],
  ['Navy Knit Long-Sleeve Shirt', L, [88, 147]],
  ['Abstract Print Long-Sleeve Shirt', L, [121]],
  ['Red Embroidered Camp Shirt', S, [31, 32, 58, 72]],
  ['Royal Blue Short-Sleeve Shirt', S, [27, 28, 59, 75]],
  ['Brown Textured Short-Sleeve Shirt', S, [21, 22, 65, 73]],
  ['Plaid Camp Shirt', S, [39, 40, 67]],
  ['Charcoal Short-Sleeve Shirt', S, [29, 30, 61, 76, 42]],
  ['Charcoal Long-Sleeve Shirt', L, [16, 17, 63, 64, 71]],
  ['Dark Hooded Short-Sleeve Shirt', S, [18, 19, 20, 53]],
  ['Cream Graphic-Print Shirt', S, [33, 34, 57, 68]],
  ['Beige Pocket Shirt', S, [23, 24, 62, 69]],
  ['Beige Pleated-Panel Shirt', S, [25, 26, 60, 74]],
  ['Green and Cream Panel Shirt', S, [10, 11, 54, 77]],
  ['Blue Camp Shirt', S, [2, 3, 49]],
]

const photo = (n: number) => `/assets/products/p-${String(n).padStart(3, '0')}.webp`

export const SEED_PRODUCTS: Product[] = ROWS.map(([name, category, photos, featured], i) => {
  const num = String(i + 1).padStart(2, '0')
  return {
    id: `kk-${num}`,
    sku: `KK-${num}`,
    name,
    category,
    description: '',
    priceKes: null,
    size: null,
    measurements: null,
    condition: null,
    flaws: null,
    quantity: null,
    status: 'available',
    images: photos.map(photo),
    featured: featured === true,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }
})
