const env = import.meta.env

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/**
 * Business settings. Every value comes from environment variables so nothing is invented:
 * a blank value means "not confirmed yet" and the UI shows an honest placeholder.
 */
export const config = {
  storeName: 'KK Preloved Shirts',
  siteUrl: clean(env.VITE_SITE_URL).replace(/\/$/, ''),
  whatsappNumber: clean(env.VITE_WHATSAPP_NUMBER).replace(/\D/g, ''),
  contactEmail: clean(env.VITE_CONTACT_EMAIL),
  instagramUrl: clean(env.VITE_INSTAGRAM_URL),
  storeCity: clean(env.VITE_STORE_CITY),
  pickupInfo: clean(env.VITE_PICKUP_INFO),
  deliveryInfo: clean(env.VITE_DELIVERY_INFO),
  returnsPolicy: clean(env.VITE_RETURNS_POLICY),
  supabaseUrl: clean(env.VITE_SUPABASE_URL),
  supabaseAnonKey: clean(env.VITE_SUPABASE_ANON_KEY),
}

export const hasWhatsApp = config.whatsappNumber.length >= 10
export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey)
