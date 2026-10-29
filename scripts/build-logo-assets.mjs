// Builds the small copies of the ACTIVE logo (the owner's illustrated logo) from the untouched original.
//   source: docs/brand/logo-original.png (never modified)
//   writes: public/logo.png, logo.webp, logo-112|224.png|webp (header and footer at 1x/2x), favicon-48.png, apple-touch-icon.png
// Run: node scripts/build-logo-assets.mjs
import { statSync } from 'node:fs'
import sharp from 'sharp'

const original = 'docs/brand/logo-original.png'
const png = { palette: true, quality: 92, effort: 10 }
for (const w of [112, 224]) {
  await sharp(original).resize(w, w).png(png).toFile(`public/logo-${w}.png`)
  await sharp(original).resize(w, w).webp({ quality: 90, effort: 6 }).toFile(`public/logo-${w}.webp`)
}
await sharp(original).resize(180, 180).png(png).toFile('public/apple-touch-icon.png')
await sharp(original).resize(48, 48).png(png).toFile('public/favicon-48.png')
await sharp(original).png(png).toFile('public/logo.png')
await sharp(original).webp({ quality: 90, effort: 6 }).toFile('public/logo.webp')
const kb = (p) => Math.round(statSync(p).size / 1024)
console.log(`logo.png ${kb(original)} KB -> ${kb('public/logo.png')} KB; logo.webp ${kb('public/logo.webp')} KB`)
