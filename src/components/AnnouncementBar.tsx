import { useState } from 'react'
import { useSettings } from '../context/SettingsContext'

const KEY = 'kk-preloved-shirts:dismissed-announcement'

function dismissedText(): string {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

/** Store announcement set in Shop Settings. A visitor can dismiss it for the session; a new message shows again. */
export default function AnnouncementBar() {
  const { settings } = useSettings()
  const [dismissed, setDismissed] = useState(dismissedText)
  const text = settings.announcement.trim()
  if (!text || dismissed === text) return null
  return (
    <div className="announcement" role="region" aria-label="Store announcement">
      <p>{text}</p>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          setDismissed(text)
          try {
            sessionStorage.setItem(KEY, text)
          } catch {
            /* ignore */
          }
        }}
      >
        ×
      </button>
    </div>
  )
}
