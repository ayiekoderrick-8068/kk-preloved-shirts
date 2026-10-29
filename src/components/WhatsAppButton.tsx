import { useLocation } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { buildAvailabilityUrl, buildWhatsAppUrl } from '../lib/order'
import { logInquiry } from '../lib/shopRepo'
import type { Product } from '../types'
import { WhatsAppIcon } from './Icons'

/**
 * Opens the shop's WhatsApp chat. With a product it pre-fills a message built from that product's real name,
 * size, price, SKU and page link. Clicking only opens WhatsApp (and logs the inquiry): it never marks anything
 * sold - the owner confirms sales in the admin.
 */
export default function WhatsAppButton({ product, label, className = 'whatsapp-btn' }: { product?: Product; label?: string; className?: string }) {
  const { settings, whatsappUrl, siteOrigin } = useSettings()
  if (!whatsappUrl) return null
  const href = product
    ? buildAvailabilityUrl(settings.whatsappNumber, product, settings.shopName, siteOrigin)
    : buildWhatsAppUrl(settings.whatsappNumber, `Hello ${settings.shopName}!`)
  const text = label ?? (product ? 'Ask on WhatsApp' : 'Chat on WhatsApp')
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${text} (opens in a new tab)`}
      onClick={() => product && logInquiry(product, 'product-inquiry')}
    >
      <WhatsAppIcon size={18} />
      <span>{text}</span>
    </a>
  )
}

/** Round floating chat button, bottom-left so it never covers the bag toast. Hidden in the admin. */
export function WhatsAppFloat() {
  const { settings, whatsappUrl } = useSettings()
  const { pathname } = useLocation()
  if (!whatsappUrl || pathname.startsWith('/admin')) return null
  return (
    <a
      className="whatsapp-float"
      href={buildWhatsAppUrl(settings.whatsappNumber, `Hello ${settings.shopName}!`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
    >
      <WhatsAppIcon size={26} />
    </a>
  )
}
