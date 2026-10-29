// Generates derived image files next to the originals. Originals are never modified or deleted.
//   product photos: p-NNN-480.webp (phones), p-NNN.avif and p-NNN-480.avif (modern browsers)
//   logo: logo-112.* / logo-224.* (header and footer at 1x/2x), favicon sizes, and a smaller logo.png
// Run: node scripts/optimize-images.mjs
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
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

// Logo. Keep the untouched original once, then derive everything from it.
mkdirSync('docs/brand', { recursive: true })
const original = 'docs/brand/logo-original.png'
if (!existsSync(original)) copyFileSync('public/logo.png', original)
const kb = (p) => Math.round(statSync(p).size / 1024)
for (const w of [112, 224]) {
  await sharp(original).resize(w, w).png({ palette: true, quality: 92, effort: 10 }).toFile(`public/logo-${w}.png`)
  await sharp(original).resize(w, w).webp({ quality: 90, effort: 6 }).toFile(`public/logo-${w}.webp`)
}
await sharp(original).resize(180, 180).png({ palette: true, quality: 92, effort: 10 }).toFile('public/apple-touch-icon.png')
await sharp(original).resize(48, 48).png({ palette: true, quality: 92, effort: 10 }).toFile('public/favicon-48.png')
await sharp(original).png({ palette: true, quality: 92, effort: 10 }).toFile('public/logo.png')
await sharp(original).webp({ quality: 90, effort: 6 }).toFile('public/logo.webp')
console.log(`logo.png ${kb(original)} KB -> ${kb('public/logo.png')} KB; logo.webp ${kb('public/logo.webp')} KB; logo-112.webp ${kb('public/logo-112.webp')} KB; logo-224.webp ${kb('public/logo-224.webp')} KB`)
