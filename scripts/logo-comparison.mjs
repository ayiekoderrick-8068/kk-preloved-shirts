// Builds docs/brand/concepts/comparison.png: every concept at real-world sizes on light and dark, so the owner can
// judge legibility (favicon, phone header, desktop header, large) and not only the big artwork.
// Run after generate-logo-concepts.mjs:  node scripts/logo-comparison.mjs
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const dir = 'docs/brand/concepts'
const ids = [['a-hanger', 'A  Hanger'], ['b-tag', 'B  Tag'], ['c-open', 'C  Open']]
const sizes = [96, 48, 32, 16]
const bg = { light: '#f6f4ef', dark: '#262622' }
const png = (file, h) => sharp(readFileSync(`${dir}/${file}`), { density: 300 }).resize({ height: h }).png().toBuffer()

const colW = 560
const rowH = 250
const W = 160 + colW * 2
const H = 60 + rowH * ids.length
const layers = []
const svgParts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>`]
svgParts.push(`<text x="170" y="36" font-family="Arial" font-size="15" font-weight="700" fill="#262622">On light (#f6f4ef)</text><text x="${170 + colW}" y="36" font-family="Arial" font-size="15" font-weight="700" fill="#262622">On dark (#262622)</text>`)

for (const [r, [id, label]] of ids.entries()) {
  const y = 60 + r * rowH
  svgParts.push(`<text x="14" y="${y + 40}" font-family="Arial" font-size="16" font-weight="700" fill="#262622">${label}</text>`)
  for (const [c, theme] of ['light', 'dark'].entries()) {
    const x = 160 + c * colW
    svgParts.push(`<rect x="${x}" y="${y}" width="${colW}" height="${rowH}" fill="${bg[theme]}"/>`)
    // monogram at four sizes, left to right
    let mx = x + 20
    for (const s of sizes) {
      layers.push({ input: await png(`concept-${id}-monogram-${theme}.svg`, s), left: mx, top: y + 20 })
      mx += s + 18
    }
    // lockups: desktop header height and phone header height
    layers.push({ input: await png(`concept-${id}-lockup-${theme}.svg`, 56), left: x + 20, top: y + 140 })
    layers.push({ input: await png(`concept-${id}-lockup-${theme}.svg`, 36), left: x + 290, top: y + 150 })
  }
  // favicon at 48 / 32 / 16 sits in the left column under the label
  let fx = 14
  for (const s of [48, 32, 16]) {
    layers.push({ input: await png(`concept-${id}-favicon.svg`, s), left: fx, top: y + 70 })
    fx += s + 12
  }
  svgParts.push(`<text x="14" y="${y + 150}" font-family="Arial" font-size="11" fill="#6b6960">favicon 48 / 32 / 16</text>`)
}
svgParts.push('</svg>')
await sharp(Buffer.from(svgParts.join('')))
  .composite(layers)
  .png()
  .toFile(`${dir}/comparison.png`)
console.log('wrote', `${dir}/comparison.png`)
