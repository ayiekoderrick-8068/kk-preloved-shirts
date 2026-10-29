// Builds the KS monogram + "Kendy Thrift Shop" wordmark CONCEPTS into docs/brand/concepts/.
// These are proposals for the owner to approve; nothing here is referenced by the website.
// Run: node scripts/generate-logo-concepts.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const out = 'docs/brand/concepts'
mkdirSync(out, { recursive: true })

const themes = {
  light: { ink: '#262622', accent: '#a24d35', bg: '#f6f4ef', sub: '#6b6960' },
  dark: { ink: '#f6f4ef', accent: '#e39a7f', bg: '#262622', sub: '#b9b5aa' },
}
const FONT = "font-family=\"Manrope, 'DM Sans', Arial, sans-serif\""

// K and S drawn as strokes on a 120x120 grid, so they do not depend on any installed font.
const K = (c, x = 0) => `<path d="M${36 + x} 30V90M${36 + x} 62L${62 + x} 32M${47 + x} 55L${64 + x} 90" stroke="${c}"/>`
const S = (c, x = 0) => `<path d="M${95 + x} 41C${91 + x} 31 ${70 + x} 31 ${70 + x} 45C${70 + x} 59 ${96 + x} 58 ${96 + x} 74C${96 + x} 89 ${74 + x} 91 ${67 + x} 80" stroke="${c}"/>`
const strokes = (inner) => `<g fill="none" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`

const concepts = {
  // A: a hanger hook over a circle: the shop is about clothes on a rail.
  'a-hanger': (t) =>
    `<circle cx="60" cy="68" r="46" fill="none" stroke="${t.ink}" stroke-width="3.5"/>` +
    `<path d="M60 22V17C60 7 74 7 74 15C74 20 68 21 62 24" fill="none" stroke="${t.accent}" stroke-width="4" stroke-linecap="round"/>` +
    `<g transform="translate(60 68) scale(.8) translate(-60 -60)">${strokes(K(t.ink, -8) + S(t.accent, -1))}</g>`,
  // B: a clothing tag with stitched edge.
  'b-tag': (t) =>
    `<rect x="10" y="10" width="100" height="100" rx="22" fill="${t.accent}"/>` +
    `<rect x="18" y="18" width="84" height="84" rx="15" fill="none" stroke="${t.bg}" stroke-width="2" stroke-dasharray="5 5" opacity=".7"/>` +
    `<g transform="translate(60 60) scale(.84) translate(-60 -60)">${strokes(K(t.bg, -7) + S(t.bg, 0))}</g>`,
  // C: open K and S with no container: quieter, more editorial.
  'c-open':(t) => strokes(K(t.ink, -10) + `<g opacity=".95">${S(t.accent, 4)}</g>`),
}

const lockup = (mono, t) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120" role="img" aria-label="Kendy Thrift Shop">` +
  `<g>${mono}</g>` +
  `<text x="132" y="68" ${FONT} font-size="46" font-weight="800" letter-spacing="-1.5" fill="${t.ink}">Kendy</text>` +
  `<text x="134" y="94" ${FONT} font-size="15" font-weight="600" letter-spacing="6.5" fill="${t.accent}">THRIFT SHOP</text></svg>`

const mark = (mono) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="KS monogram">${mono}</svg>`

const favicon = (id, t) => {
  // Favicons must read at 16-32px: solid accent square with a bold, simplified KS.
  const bg = id === 'b-tag' ? t.ink : t.accent
  const fg = '#f6f4ef'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="26" fill="${bg}"/>${strokes(K(fg, -4).replace('stroke="' + fg + '"', `stroke="${fg}"`) + S(fg, -4))}</svg>`
}

const svgs = {}
for (const [id, make] of Object.entries(concepts)) {
  for (const [tn, t] of Object.entries(themes)) {
    const mono = make(t)
    svgs[`concept-${id}-monogram-${tn}.svg`] = mark(mono)
    svgs[`concept-${id}-lockup-${tn}.svg`] = lockup(mono, t)
  }
  svgs[`concept-${id}-favicon.svg`] = favicon(id, themes.light)
}
for (const [name, svg] of Object.entries(svgs)) writeFileSync(`${out}/${name}`, svg)

// One contact sheet so all concepts can be compared side by side on light and dark backgrounds.
const rowH = 170
const ids = Object.keys(concepts)
const cells = ids
  .map((id, i) => {
    const y = i * rowH
    const t1 = themes.light
    const t2 = themes.dark
    return (
      `<rect x="0" y="${y}" width="470" height="${rowH}" fill="${t1.bg}"/><rect x="470" y="${y}" width="470" height="${rowH}" fill="${t2.bg}"/>` +
      `<g transform="translate(25 ${y + 25})">${lockup(concepts[id](t1), t1).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g>` +
      `<g transform="translate(495 ${y + 25})">${lockup(concepts[id](t2), t2).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g>` +
      `<text x="25" y="${y + 160}" ${FONT} font-size="11" fill="${t1.sub}">Concept ${id.toUpperCase().replace('-', ' ')}</text>`
    )
  })
  .join('')
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 ${rowH * ids.length}" width="940" height="${rowH * ids.length}">${cells}</svg>`
writeFileSync(`${out}/concept-sheet.svg`, sheet)
await sharp(Buffer.from(sheet), { density: 144 }).png().toFile(`${out}/concept-sheet.png`)
for (const id of ids) await sharp(Buffer.from(svgs[`concept-${id}-favicon.svg`]), { density: 300 }).resize(32, 32).png().toFile(`${out}/concept-${id}-favicon-32.png`)
console.log('wrote', Object.keys(svgs).length, 'svg files + concept-sheet.png to', out)
