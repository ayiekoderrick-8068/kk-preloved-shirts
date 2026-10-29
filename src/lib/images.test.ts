import { describe, expect, it } from 'vitest'
import { fitWithin, logoSources, originalPathFor, srcSetFor, staticSources, variantUrl } from './images'

describe('staticSources (built-in shop photos)', () => {
  it('gives AVIF and WebP srcsets with a phone-sized and a full-size file', () => {
    const s = staticSources('/assets/products/p-002.webp')
    expect(s?.avif).toBe('/assets/products/p-002-480.avif 480w, /assets/products/p-002.avif 880w')
    expect(s?.webp).toBe('/assets/products/p-002-480.webp 480w, /assets/products/p-002.webp 880w')
  })
  it('leaves uploaded, external and legacy photos alone', () => {
    expect(staticSources('https://x.supabase.co/storage/v1/object/public/product-images/a/b-1600.webp')).toBeUndefined()
    expect(staticSources('https://example.com/p-002.webp')).toBeUndefined()
    expect(staticSources('/assets/shirt-01.webp')).toBeUndefined()
    expect(staticSources('/assets/products/p-002-480.webp')).toBeUndefined()
  })
})

describe('uploaded photo variants', () => {
  it('derives smaller sizes from the largest stored URL', () => {
    expect(variantUrl('https://cdn/x/abc-1600.webp', 480)).toBe('https://cdn/x/abc-480.webp')
    expect(srcSetFor('https://cdn/x/abc-1600.webp')).toBe('https://cdn/x/abc-480.webp 480w, https://cdn/x/abc-960.webp 960w, https://cdn/x/abc-1600.webp 1600w')
    expect(srcSetFor('https://cdn/x/plain.jpg')).toBeUndefined()
  })
})

describe('originalPathFor', () => {
  it('links an uploaded photo to its private original', () => {
    expect(originalPathFor('https://x.supabase.co/storage/v1/object/public/product-images/products/abc-1600.webp')).toBe('products/abc-original')
    expect(originalPathFor('https://x.supabase.co/storage/v1/object/public/product-images/products/abc-1600.jpg')).toBe('products/abc-original')
  })
  it('has none for built-in or external photos', () => {
    expect(originalPathFor('/assets/products/p-002.webp')).toBeUndefined()
    expect(originalPathFor('https://example.com/shirt.jpg')).toBeUndefined()
  })
})

describe('fitWithin', () => {
  it('keeps the aspect ratio and never upscales', () => {
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 })
    expect(fitWithin(800, 1000, 1600)).toEqual({ width: 800, height: 1000 })
  })
})

describe('logoSources', () => {
  it('uses small copies only for the default logo', () => {
    expect(logoSources('/logo.png', 56)?.src).toBe('/logo-112.png')
    expect(logoSources('/logo.png', 200)?.webpSrcSet).toBe('/logo-224.webp 1x, /logo-224.webp 2x')
    expect(logoSources('https://cdn/custom-logo.png', 56)).toBeUndefined()
  })
})
