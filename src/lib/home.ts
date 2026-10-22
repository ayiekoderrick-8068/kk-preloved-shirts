import type { Product } from '../types'
import { stockState } from './inventory'

/**
 * Shirts for the "Why pre-loved" photo collage, back to front (last = in front):
 * beige half-zip (KK-13), dusty pink (KK-05), white textured button-up (KK-12).
 */
export const COLLAGE_IDS = ['kk-13', 'kk-05', 'kk-12']

export interface HomepagePicks {
  featured: Product[]
  collage: Product[]
}

/**
 * Chooses homepage products so no shirt appears in two sections. The spotlight uses products flagged
 * `featured` (editable in the admin); the collage uses COLLAGE_IDS but never a shirt already in the spotlight.
 * Sold items are skipped everywhere.
 */
export function pickHomepage(live: Product[], collageIds: string[] = COLLAGE_IDS, featuredCount = 4): HomepagePicks {
  const available = live.filter((p) => stockState(p) !== 'sold')
  const featured = available.filter((p) => p.featured).slice(0, featuredCount)
  const used = new Set(featured.map((p) => p.id))

  const collage: Product[] = []
  for (const id of collageIds) {
    const p = available.find((x) => x.id === id)
    if (p && !used.has(p.id)) {
      collage.push(p)
      used.add(p.id)
    }
  }
  // If a collage shirt is gone or already featured, fill with other unused shirts rather than repeat one.
  for (const p of available) {
    if (collage.length >= collageIds.length) break
    if (!used.has(p.id)) {
      collage.push(p)
      used.add(p.id)
    }
  }
  return { featured, collage }
}
