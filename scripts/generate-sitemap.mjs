// Writes public/sitemap.xml and points robots.txt at it, using VITE_SITE_URL (env var or .env.local).
// Runs automatically before `npm run build`. Without a site URL it removes the sitemap rather than publish wrong links.
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs'

function envValue(name) {
  if (process.env[name]) return process.env[name]
  for (const f of ['.env.local', '.env']) {
    if (!existsSync(f)) continue
    const m = readFileSync(f, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'))
    if (m && m[1].trim()) return m[1].trim()
  }
  return ''
}

const site = envValue('VITE_SITE_URL').replace(/\/$/, '')
const robots = (extra) => `User-agent: *\nAllow: /\nDisallow: /admin\n${extra}`

if (!site) {
  rmSync('public/sitemap.xml', { force: true })
  writeFileSync('public/robots.txt', robots(''))
  console.warn('[sitemap] VITE_SITE_URL not set - skipped sitemap. Set it before production deploys.')
} else {
  const paths = ['/', '/shop', '/about', '/contact', '/delivery-returns', '/faq']
  // Seed product pages. Products added later in the database are not listed here (see README).
  for (let i = 1; i <= 19; i++) paths.push(`/shop/kk-${String(i).padStart(2, '0')}`)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n')}\n</urlset>\n`
  writeFileSync('public/sitemap.xml', xml)
  writeFileSync('public/robots.txt', robots(`\nSitemap: ${site}/sitemap.xml\n`))
  console.log(`[sitemap] wrote ${paths.length} URLs for ${site}`)
}
