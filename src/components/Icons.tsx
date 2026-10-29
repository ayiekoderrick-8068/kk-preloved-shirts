interface IconProps {
  size?: number
}

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export function WhatsAppIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" />
      <path d="M9 8.5c.3 2.6 3.6 5.9 6.2 6.2l1.3-1.3-2-1.2-1 .8c-.9-.4-2-1.5-2.4-2.4l.8-1-1.2-2L9 8.5Z" />
    </svg>
  )
}

export function InstagramIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r=".6" fill="currentColor" />
    </svg>
  )
}

export function TikTokIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M14 3.5v11.2a3.7 3.7 0 1 1-3.7-3.7" />
      <path d="M14 3.5c.3 2.4 1.9 4 4.5 4.2" />
    </svg>
  )
}
