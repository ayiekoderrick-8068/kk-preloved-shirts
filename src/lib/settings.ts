import type { ShopSettings } from '../types'
import { config } from './config'

/**
 * Built-in defaults (from the owner's original details and environment variables). The owner's saved settings
 * override any field that is not blank, so the site always has a name, logo and WhatsApp line to fall back on.
 * The slogan, TikTok and announcement default to blank: nothing is invented for the shop.
 */
export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: config.storeName,
  slogan: '',
  logoUrl: '/logo.png',
  whatsappNumber: config.whatsappNumber,
  instagramUrl: config.instagramUrl,
  tiktokUrl: config.tiktokUrl,
  contactEmail: config.contactEmail,
  contactPhone: '',
  announcement: '',
  description: 'We scour the best thrifts for unique, one-of-a-kind pieces. Once a piece is gone, it’s gone.',
}

export function mergeSettings(overrides: Partial<ShopSettings>, defaults: ShopSettings = DEFAULT_SETTINGS): ShopSettings {
  const out = { ...defaults }
  for (const key of Object.keys(defaults) as (keyof ShopSettings)[]) {
    const v = overrides[key]
    if (typeof v === 'string' && v.trim() !== '') out[key] = v
  }
  return out
}

export const whatsappLink = (number: string): string => (number.replace(/\D/g, '').length >= 9 ? `https://wa.me/${number.replace(/\D/g, '')}` : '')
