// SHELVED alternative logo: Concept B "Tag" drawn as KK, built from one vector source.
//   docs/brand/approved/   master SVGs (light, dark, favicon)  <- always written
//   public/                logo.svg, logo-dark.svg, favicon.svg + rasters  <- only with --activate
// The ACTIVE logo is the owner's illustrated one (docs/brand/logo-original.png, built by build-logo-assets.mjs).
// Running this script WITHOUT --activate leaves the live logo untouched.
// To change the letters, edit LETTERS below.  To switch the site to the tag: node scripts/build-brand-assets.mjs --activate
// (then also add the favicon.svg link to index.html).
import { mkdirSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const LETTERS = ['K', 'K']
const themes = {
  light: { tag: '#a24d35', mark: '#f6f4ef' },
  dark: { tag: '#e39a7f', mark: '#262622' },
}

// Letter shapes are strokes on a 120x120 grid, so nothing depends on an installed font.
const glyph = {
  K: (x) => `M${36 + x} 30V90M${36 + x} 62L${62 + x} 32M${47 + x} 55L${64 + x} 90`,
  S: (x) => `M${95 + x} 41C${91 + x} 31 ${70 + x} 31 ${70 + x} 45C${70 + x} 59 ${96 + x} 58 ${96 + x} 74C${96 + x} 89 ${74 + x} 91 ${67 + x} 80`,
}
const offsets = LETTERS.length === 2 && LETTERS.join('') === 'KK' ? [-11, 29] : [-7, 0]
const letters = (c) =>
  `<g transform="translate(60 60) scale(.9) translate(-59 -60)" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">${LETTERS.map((l, i) => `<path d="${glyph[l](offsets[i])}"/>`).join('')}</g>`

const svg = (t, { rounded = true } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="${LETTERS.join('')} monogram">` +
  `<rect ${rounded ? 'x="10" y="10" width="100" height="100" rx="22"' : 'width="120" height="120"'} fill="${t.tag}"/>` +
  (rounded ? `<rect x="18" y="18" width="84" height="84" rx="15" fill="none" stroke="${t.mark}" stroke-width="2" stroke-dasharray="5 5" opacity=".7"/>` : '') +
  letters(t.mark) +
  `</svg>`

// Favicon: no stitch border (it turns to noise at 16px), filling the whole square for crisp edges.
const favicon = (t) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="26" fill="${t.tag}"/>${letters(t.mark)}</svg>`

mkdirSync('docs/brand/approved', { recursive: true })
const files = {
  'logo-light.svg': svg(themes.light),
  'logo-dark.svg': svg(themes.dark),
  'favicon.svg': favicon(themes.light),
}
for (const [n, s] of Object.entries(files)) writeFileSync(`docs/brand/approved/${n}`, s)
if (!process.argv.includes('--activate')) {
  console.log('masters written to docs/brand/approved; the live logo in public/ was NOT changed (use --activate to switch)')
  process.exit(0)
}
writeFileSync('public/logo.svg', files['logo-light.svg'])
writeFileSync('public/logo-dark.svg', files['logo-dark.svg'])
writeFileSync('public/favicon.svg', files['favicon.svg'])

const raster = (source, size) => sharp(Buffer.from(source), { density: 600 }).resize(size, size)
const light = files['logo-light.svg']
// Social cards need an opaque bitmap (transparent corners can render black), so flatten onto the paper colour.
await raster(light, 640).flatten({ background: '#f6f4ef' }).png({ palette: true, quality: 95, effort: 10 }).toFile('public/logo.png')
await raster(light, 640).webp({ quality: 92 }).toFile('public/logo.webp')
for (const s of [112, 224]) {
  await raster(light, s).png({ palette: true, quality: 95, effort: 10 }).toFile(`public/logo-${s}.png`)
  await raster(light, s).webp({ quality: 92 }).toFile(`public/logo-${s}.webp`)
}
await raster(files['favicon.svg'], 48).png().toFile('public/favicon-48.png')
await raster(favicon(themes.light).replace('rx="26"', 'rx="0"'), 180).png().toFile('public/apple-touch-icon.png') // iOS rounds it itself
console.log('brand assets written: docs/brand/approved/* and public/logo*, favicon*, apple-touch-icon.png')
