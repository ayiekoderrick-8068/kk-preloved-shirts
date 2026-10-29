import { useState, type FormEvent, type ReactNode } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { uploadImage } from '../../lib/productRepo'
import { DEFAULT_SETTINGS } from '../../lib/settings'
import { parseWhatsApp, validateSettings, type SettingsErrors } from '../../lib/validate'
import type { ShopSettings } from '../../types'

function Field({ name, label, hint, error, children }: { name: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={`field-${name}`}>{label}</label>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="error" id={`error-${name}`} role="alert">{error}</span>}
    </div>
  )
}

/** Shop-wide details shown across the public site. Saved changes appear on the storefront without any code edit. */
export default function SettingsPage() {
  const { ready, error } = useSettings()
  if (ready) return <SettingsForm />
  if (error) return <p className="error" role="alert">Settings could not be loaded, so editing is switched off to protect what is saved: {error}. Check that the database migration in supabase/migrations has been run.</p>
  return <p role="status">Loading your settings…</p>
}

function SettingsForm() {
  const { settings, save } = useSettings()
  const notify = useToast()
  const [form, setForm] = useState<ShopSettings>(settings)
  const [whatsapp, setWhatsapp] = useState(settings.whatsappNumber)
  const [errors, setErrors] = useState<SettingsErrors>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadError, setUploadError] = useState('')

  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) => {
    setMessage('')
    setForm((f) => ({ ...f, [k]: v }))
  }
  const a11y = (k: keyof ShopSettings) => ({ id: `field-${k}`, 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `error-${k}` : undefined })

  async function submit(e: FormEvent) {
    e.preventDefault()
    const next: ShopSettings = { ...form, whatsappNumber: parseWhatsApp(whatsapp) }
    const errs = validateSettings(next, whatsapp)
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      document.getElementById(`field-${first}`)?.focus()
      return
    }
    setBusy(true)
    try {
      await save(next)
      setForm(next)
      setWhatsapp(next.whatsappNumber || whatsapp)
      setMessage('Saved. The changes are now showing on the shop.')
      notify('Shop settings saved.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={submit} noValidate aria-label="Shop settings">
      <h2>Shop settings</h2>
      <p className="note">These details appear across the shop. Leave a link blank if you do not have that account yet: its icon will simply not be shown.</p>
      {message && <p role="status" className={message.startsWith('Saved') ? 'success' : 'error'}>{message}</p>}

      <div className="grid-form">
        <Field name="shopName" label="Shop name *" error={errors.shopName}>
          <input {...a11y('shopName')} value={form.shopName} onChange={(e) => set('shopName', e.target.value)} maxLength={60} />
        </Field>
        <Field name="slogan" label="Shop slogan" error={errors.slogan} hint="Leave blank until the final wording is chosen">
          <input {...a11y('slogan')} value={form.slogan} onChange={(e) => set('slogan', e.target.value)} maxLength={120} />
        </Field>
        <Field name="whatsappNumber" label="WhatsApp Business number or link" error={errors.whatsappNumber} hint="e.g. 0712 345 678, +254712345678 or https://wa.me/254712345678">
          <input {...a11y('whatsappNumber')} value={whatsapp} onChange={(e) => { setMessage(''); setWhatsapp(e.target.value) }} inputMode="tel" />
        </Field>
        <Field name="contactPhone" label="Phone number for calls" error={errors.contactPhone}>
          <input {...a11y('contactPhone')} value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} inputMode="tel" />
        </Field>
        <Field name="instagramUrl" label="Instagram link" error={errors.instagramUrl} hint="https://www.instagram.com/youraccount">
          <input {...a11y('instagramUrl')} type="url" value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} />
        </Field>
        <Field name="tiktokUrl" label="TikTok link" error={errors.tiktokUrl} hint="https://www.tiktok.com/@youraccount">
          <input {...a11y('tiktokUrl')} type="url" value={form.tiktokUrl} onChange={(e) => set('tiktokUrl', e.target.value)} />
        </Field>
        <Field name="contactEmail" label="Contact email" error={errors.contactEmail}>
          <input {...a11y('contactEmail')} type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
        </Field>
      </div>

      <Field name="announcement" label="Store announcement" error={errors.announcement} hint="Shown in a bar at the top of every page. Leave blank for none">
        <input {...a11y('announcement')} value={form.announcement} onChange={(e) => set('announcement', e.target.value)} maxLength={200} />
      </Field>
      <Field name="description" label="Shop description" error={errors.description} hint="Shown in the footer">
        <textarea {...a11y('description')} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={600} />
      </Field>

      <fieldset className="uploader">
        <legend>Logo</legend>
        <div className="logo-row">
          <img src={form.logoUrl} alt="Current logo" width="96" height="96" className="logo-preview" />
          <div>
            <label className="secondary file-btn">
              Upload a new logo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                aria-label="Upload logo"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (!f) return
                  try {
                    set('logoUrl', await uploadImage(f, 'branding'))
                    setUploadError('')
                  } catch (err) {
                    setUploadError(err instanceof Error ? err.message : 'Upload failed')
                  }
                }}
              />
            </label>
            <button type="button" className="text-link" onClick={() => set('logoUrl', DEFAULT_SETTINGS.logoUrl)}>Use the standard logo</button>
            <p className="note">Square images work best. Save the settings to publish the new logo.</p>
          </div>
        </div>
        {uploadError && <p className="error" role="alert">{uploadError}</p>}
        {errors.logoUrl && <p className="error" role="alert">{errors.logoUrl}</p>}
      </fieldset>

      <div className="admin-actions">
        <button className="primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
      </div>
    </form>
  )
}
