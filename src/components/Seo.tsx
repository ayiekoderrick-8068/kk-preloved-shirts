import { useEffect } from 'react'
import { useSettings } from '../context/SettingsContext'
import { config } from '../lib/config'

interface Props {
  title: string
  description: string
  path?: string
  image?: string
  noindex?: boolean
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

/** Per-route title, description, canonical and Open Graph tags (index.html carries the static defaults for crawlers). */
export default function Seo({ title, description, path = '/', image, noindex }: Props) {
  const { settings } = useSettings()
  const shopName = settings.shopName
  const picture = image ?? settings.logoUrl
  useEffect(() => {
    const full = title.includes(shopName) ? title : `${title} | ${shopName}`
    document.title = full
    const base = config.siteUrl || window.location.origin
    const url = base + path
    const img = picture.startsWith('http') ? picture : base + picture
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', full)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', url)
    setMeta('meta[property="og:image"]', 'property', 'og:image', img)
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow')
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = url
  }, [title, description, path, picture, shopName, noindex])
  return null
}
