import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { config } from '../lib/config'
import { DEFAULT_SETTINGS, mergeSettings, whatsappLink } from '../lib/settings'
import { loadSettingsOverrides, saveSettings } from '../lib/shopRepo'
import type { ShopSettings } from '../types'

interface SettingsValue {
  settings: ShopSettings
  /** False until the saved settings have been fetched (the admin form waits, so it never saves defaults over them). */
  ready: boolean
  /** Why the saved settings could not be loaded (for example the database migration has not been run). */
  error: string | null
  /** https://wa.me/<number>, or '' when no WhatsApp number is set. */
  whatsappUrl: string
  hasWhatsApp: boolean
  /** Public site origin used in shared links. */
  siteOrigin: string
  save: (s: ShopSettings) => Promise<void>
}

const Ctx = createContext<SettingsValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setSettings(mergeSettings(await loadSettingsOverrides()))
      setReady(true)
      setError(null)
    } catch (e) {
      // Keep the built-in defaults if the database cannot be reached; the admin form stays locked.
      setError(e instanceof Error ? e.message : 'Could not load the shop settings.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<SettingsValue>(
    () => ({
      settings,
      ready,
      error,
      whatsappUrl: whatsappLink(settings.whatsappNumber),
      hasWhatsApp: whatsappLink(settings.whatsappNumber) !== '',
      siteOrigin: config.siteUrl || window.location.origin,
      save: async (s) => {
        await saveSettings(s)
        await load()
      },
    }),
    [settings, ready, error, load],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings(): SettingsValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSettings must be used inside SettingsProvider')
  return v
}
