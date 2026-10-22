// One-off helper: compress raw shop photos into public/assets/products/ and write a contact sheet to check grouping.
// Usage: node scripts/process-photos.mjs <raw-photo-dir> <contact-sheet-out-dir>
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const [src, sheetDir] = process.argv.slice(2)
const out = 'public/assets/products'
mkdirSync(out, { recursive: true })
mkdirSync(sheetDir, { recursive: true })

const files = readdirSync(src)
  .filter((f) => /\.jpe?g$/i.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b))

const items = []
for (const f of files) {
  const n = parseInt(f)
  const base = sharp(join(src, f)).rotate()
  const name = `p-${String(n).padStart(3, '0')}.webp`
  await base.clone().resize({ height: 1100, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(out, name))
  // Signature: mean colour of the central body region at 8x8.
  const meta = await base.clone().metadata()
  const w = meta.width ?? 1000
  const h = meta.height ?? 1000
  const { data } = await base
    .clone()
    .extract({ left: Math.round(w * 0.3), top: Math.round(h * 0.4), width: Math.round(w * 0.4), height: Math.round(h * 0.35) })
    .resize(4, 4, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then((r) => ({ data: [...r.data] }))
  items.push({ n, name, sig: data })
}

const dist = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / a.length)
items.forEach((it, i) => (it.d = i === 0 ? 999 : dist(it.sig, items[i - 1].sig)))
writeFileSync(join(sheetDir, 'items.json'), JSON.stringify(items.map(({ n, name, d }) => ({ n, name, d: Math.round(d) }))))

// Contact sheets: 6 columns x 7 rows per sheet, label = photo number + distance to previous.
const COLS = 6
const ROWS = 7
const T = 220
for (let s = 0; s * COLS * ROWS < items.length; s++) {
  const chunk = items.slice(s * COLS * ROWS, (s + 1) * COLS * ROWS)
  const comps = []
  for (let i = 0; i < chunk.length; i++) {
    const it = chunk[i]
    const thumb = await sharp(join(out, it.name)).resize(T, T, { fit: 'contain', background: '#fff' }).toBuffer()
    const label = Buffer.from(`<svg width="${T}" height="26"><rect width="${T}" height="26" fill="#000"/><text x="6" y="19" font-size="16" fill="#fff" font-family="sans-serif">#${it.n}  d=${Math.round(it.d)}</text></svg>`)
    const x = (i % COLS) * T
    const y = Math.floor(i / COLS) * (T + 26)
    comps.push({ input: thumb, left: x, top: y + 26 }, { input: label, left: x, top: y })
  }
  await sharp({ create: { width: COLS * T, height: ROWS * (T + 26), channels: 3, background: '#888' } })
    .composite(comps)
    .jpeg({ quality: 70 })
    .toFile(join(sheetDir, `sheet-${s + 1}.jpg`))
}
console.log(`processed ${items.length} photos`)
