import { describe, expect, it } from 'vitest'
import { SEED_PRODUCTS } from '../data/seed'
import { COLLAGE_IDS, pickHomepage } from './home'

describe('pickHomepage', () => {
  it('shows four spotlight shirts and a three-shirt collage with no repeats', () => {
    const { featured, collage } = pickHomepage(SEED_PRODUCTS)
    expect(featured).toHaveLength(4)
    expect(collage.map((p) => p.id)).toEqual(COLLAGE_IDS)
    const ids = [...featured, ...collage].map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    const photos = [...featured, ...collage].map((p) => p.images[0])
    expect(new Set(photos).size).toBe(photos.length)
  })
  it('collage uses the beige half-zip, dusty pink and white textured shirts', () => {
    const { collage } = pickHomepage(SEED_PRODUCTS)
    expect(collage.map((p) => p.name)).toEqual(['Beige Half-Zip Shirt', 'Dusty Pink Short-Sleeve Shirt', 'White Textured Short-Sleeve Shirt'])
  })
  it('never repeats a shirt when a collage shirt is featured or sold', () => {
    const products = SEED_PRODUCTS.map((p) => (p.id === 'kk-13' ? { ...p, featured: true } : p.id === 'kk-05' ? { ...p, status: 'sold' as const } : p))
    const { featured, collage } = pickHomepage(products)
    const ids = [...featured, ...collage].map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(collage).toHaveLength(3)
    expect(collage.some((p) => p.id === 'kk-05')).toBe(false)
  })
})
