import { useSettings } from '../context/SettingsContext'
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from './Icons'

/**
 * Instagram / TikTok / WhatsApp icon links. Each one only renders when the owner has set its link in
 * Shop Settings, so there are never dead or invented accounts.
 */
export default function SocialLinks({ className = '', showWhatsApp = false }: { className?: string; showWhatsApp?: boolean }) {
  const { settings, whatsappUrl } = useSettings()
  const links = [
    showWhatsApp && whatsappUrl ? { href: whatsappUrl, label: 'WhatsApp', icon: <WhatsAppIcon /> } : null,
    settings.instagramUrl ? { href: settings.instagramUrl, label: 'Instagram', icon: <InstagramIcon /> } : null,
    settings.tiktokUrl ? { href: settings.tiktokUrl, label: 'TikTok', icon: <TikTokIcon /> } : null,
  ].filter((l): l is { href: string; label: string; icon: React.ReactElement } => l !== null)
  if (links.length === 0) return null
  return (
    <ul className={`social-links ${className}`.trim()} aria-label="Follow us">
      {links.map((l) => (
        <li key={l.label}>
          <a href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`${l.label} (opens in a new tab)`} title={l.label}>
            {l.icon}
          </a>
        </li>
      ))}
    </ul>
  )
}
