const env = import.meta.env

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/** Kenyan local number (07XX…/01XX…) to international digits (2547XX…). */
const intl = (local: string): string => '254' + local.replace(/\D/g, '').replace(/^0/, '')

/**
 * Business settings. Details supplied by the shop owner are defaults here; environment variables
 * override them. A blank value means "not confirmed yet" and the UI shows an honest placeholder.
 */
export const config = {
  storeName: 'KK Pre-Loved Shirts',
  tagline: "Pre-loved men's shirts - unique, one-of-a-kind pieces.",
  siteUrl: clean(env.VITE_SITE_URL).replace(/\/$/, ''),
  /** Order number: WhatsApp requests go here. Digits only, with country code. */
  whatsappNumber: clean(env.VITE_WHATSAPP_NUMBER).replace(/\D/g, '') || intl('0782718496'),
  /** Second call/WhatsApp line supplied by the shop. */
  secondaryPhone: clean(env.VITE_SECONDARY_PHONE).replace(/\D/g, '') || intl('0741973359'),
  /** Booking fee per item, in KES (shop wrote "@200"). */
  bookingFeeKes: Number(clean(env.VITE_BOOKING_FEE_KES)) || 200,
  /** Pochi la Biashara number for booking payments (local format, as customers type it). */
  pochiNumber: clean(env.VITE_POCHI_NUMBER) || '0113138779',
  contactEmail: clean(env.VITE_CONTACT_EMAIL),
  /** Handles supplied by the owner (Instagram in chat, TikTok from the profile screenshot), 2026-10-29. */
  instagramUrl: clean(env.VITE_INSTAGRAM_URL) || 'https://www.instagram.com/k.kpre_loved_shirts',
  tiktokUrl: clean(env.VITE_TIKTOK_URL) || 'https://www.tiktok.com/@k.kpre_loved_shirts',
  storeCity: clean(env.VITE_STORE_CITY),
  pickupInfo: clean(env.VITE_PICKUP_INFO),
  deliveryInfo: clean(env.VITE_DELIVERY_INFO),
  returnsPolicy: clean(env.VITE_RETURNS_POLICY),
  supabaseUrl: clean(env.VITE_SUPABASE_URL),
  supabaseAnonKey: clean(env.VITE_SUPABASE_ANON_KEY),
}

export const hasWhatsApp = config.whatsappNumber.length >= 10
export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey)

/** Display form of an international number, e.g. 254782718496 -> 0782 718 496. */
export const localDisplay = (intlNumber: string): string => {
  const d = '0' + intlNumber.replace(/^254/, '')
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`
}
