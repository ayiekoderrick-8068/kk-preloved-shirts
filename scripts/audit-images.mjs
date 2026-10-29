// Reports the size and dimensions of every static image so optimisation decisions are based on data.
import { readdirSync, statSync } from 'node:fs'
import sharp from 'sharp'

const dir = 'public/assets/products'
const buckets = {}
let bytes = 0
for (const f of readdirSync(dir)) {
  if (!/\.(webp|jpe?g|png)$/.test(f) || /-(480|960)\.webp$/.test(f)) continue
  const m = await sharp(`${dir}/${f}`).metadata()
  const k = `${m.width}x${m.height}`
  buckets[k] = (buckets[k] ?? 0) + 1
  bytes += statSync(`${dir}/${f}`).size
}
console.log('product photos by size:', buckets)
console.log('total KB:', Math.round(bytes / 1024))
const logo = await sharp('public/logo.png').metadata()
console.log('logo:', logo.format, logo.width, logo.height, Math.round(statSync('public/logo.png').size / 1024), 'KB')
console.log('vips', sharp.versions.vips, 'avif output:', !!sharp.format.heif?.output?.buffer)
