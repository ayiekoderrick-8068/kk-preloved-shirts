// Generates derived image files next to the originals. Originals are never modified or deleted.
//   product photos: p-NNN-480.webp (phones), p-NNN.avif and p-NNN-480.avif (modern browsers)
//   (the logo is built by scripts/build-brand-assets.mjs)
// Run: node scripts/optimize-images.mjs
import { existsSync, readdirSync } from 'node:fs'
import sharp from 'sharp'

const dir = 'public/assets/products'
let made = 0
for (const f of readdirSync(dir)) {
  const m = /^(p-\d+)\.webp$/.exec(f)
  if (!m) continue
  const src = `${dir}/${f}`
  const base = `${dir}/${m[1]}`
  const jobs = [
    [`${base}-480.webp`, () => sharp(src).resize({ width: 480 }).webp({ quality: 80, effort: 5 })],
    [`${base}.avif`, () => sharp(src).avif({ quality: 55, effort: 2 })],
    [`${base}-480.avif`, () => sharp(src).resize({ width: 480 }).avif({ quality: 55, effort: 2 })],
  ]
  for (const [out, make] of jobs) {
    if (existsSync(out)) continue
    await make().toFile(out)
    made++
  }
}
console.log('product variants created:', made)

// The logo is built separately from the approved vector source: node scripts/build-brand-assets.mjs
