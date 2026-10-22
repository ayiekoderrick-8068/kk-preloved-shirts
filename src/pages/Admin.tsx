import { useEffect, useState, type FormEvent } from 'react'
import Seo from '../components/Seo'
import { useProducts } from '../context/ProductsContext'
import { priceLabel, stockLabel } from '../lib/inventory'
import { uploadImage } from '../lib/productRepo'
import { supabase } from '../lib/supabase'
import { CATEGORIES, CONDITIONS, STATUSES, validateProduct, type ProductErrors } from '../lib/validate'
import type { Measurements, Product } from '../types'

type Auth = 'checking' | 'signed-out' | 'not-admin' | 'admin'

function blankProduct(count: number): Product {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    sku: `KK-${String(count + 1).padStart(2, '0')}`,
    name: '',
    category: 'Short sleeve',
    description: '',
    priceKes: null,
    size: null,
    measurements: null,
    condition: null,
    flaws: null,
    quantity: 1,
    status: 'available',
    images: [],
    featured: false,
    createdAt: now,
    updatedAt: now,
  }
}

export default function Admin() {
  const { all, source, save, importSeedProducts, resetDemoData, refresh } = useProducts()
  const [auth, setAuth] = useState<Auth>(source === 'demo' ? 'admin' : 'checking')
  const [editing, setEditing] = useState<Product | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    async function check() {
      const { data } = await client.auth.getUser()
      if (!data.user) return setAuth('signed-out')
      const { data: row } = await client.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
      setAuth(row ? 'admin' : 'not-admin')
      if (row) void refresh()
    }
    void check()
    const { data: sub } = client.auth.onAuthStateChange(() => void check())
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const run = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn()
      setMessage(ok)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong.')
    }
  }

  return (
    <section className="section page admin">
      <Seo title="Admin" description="Inventory management" path="/admin" noindex />
      <p className="eyebrow">Admin</p>
      <h1>Inventory</h1>

      {source === 'demo' && (
        <p className="banner" role="note">
          <strong>Demo mode - no database connected.</strong> Edits are saved only in this browser and are NOT visible to customers. Set the Supabase variables (see README) for real, shared, secured inventory.
        </p>
      )}

      {auth === 'checking' && <p role="status">Checking sign-in…</p>}
      {auth === 'signed-out' && <SignIn />}
      {auth === 'not-admin' && (
        <p className="banner" role="alert">
          You are signed in but this account is not an admin. Ask the owner to add you to the admins table.{' '}
          <button type="button" className="text-link" onClick={() => supabase?.auth.signOut()}>Sign out</button>
        </p>
      )}

      {auth === 'admin' && (
        <>
          <div className="admin-actions">
            <button type="button" className="primary" onClick={() => setEditing(blankProduct(all.length))}>Add shirt</button>
            {source === 'database' && all.length === 0 && (
              <button type="button" className="secondary" onClick={() => run(importSeedProducts, 'Imported the starter shirts. Now verify each one.')}>Import the starter shirts</button>
            )}
            {source === 'demo' && <button type="button" className="secondary" onClick={() => { resetDemoData(); setMessage('Demo data reset.') }}>Reset demo data</button>}
            {source === 'database' && <button type="button" className="text-link" onClick={() => supabase?.auth.signOut()}>Sign out</button>}
          </div>
          {message && <p role="status" className="success">{message}</p>}

          {editing && (
            <ProductForm
              key={editing.id}
              initial={editing}
              onCancel={() => setEditing(null)}
              onSave={async (p) => {
                await run(() => save(p), `Saved ${p.name}.`)
                setEditing(null)
              }}
            />
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>SKU</th><th>Name</th><th>Price</th><th>Size</th><th>Condition</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {all.map((p) => (
                  <tr key={p.id}>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{priceLabel(p)}{p.priceKes === null ? ' (standard)' : ''}</td>
                    <td className={p.size ? '' : 'tbc'}>{p.size ?? 'unverified'}</td>
                    <td className={p.condition ? '' : 'tbc'}>{p.condition ?? 'unverified'}</td>
                    <td>{stockLabel(p)}</td>
                    <td>{p.status}</td>
                    <td className="row-actions">
                      <button type="button" onClick={() => setEditing(p)}>Edit</button>
                      {p.status !== 'sold' && <button type="button" onClick={() => run(() => save({ ...p, status: 'sold', quantity: 0 }), `${p.name} marked sold.`)}>Mark sold</button>}
                      {p.status !== 'archived' ? (
                        <button type="button" onClick={() => run(() => save({ ...p, status: 'archived' }), `${p.name} archived.`)}>Archive</button>
                      ) : (
                        <button type="button" onClick={() => run(() => save({ ...p, status: 'available' }), `${p.name} restored.`)}>Restore</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const { error: err } = await supabase!.auth.signInWithPassword({ email, password })
    setError(err ? 'Sign-in failed. Check your email and password.' : '')
  }

  return (
    <form onSubmit={submit} className="admin-form narrow" aria-label="Admin sign in">
      <label className="field">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
      <label className="field">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" type="submit">Sign in</button>
    </form>
  )
}

const num = (s: string): number | undefined => (s.trim() === '' ? undefined : Number(s))

function ProductForm({ initial, onSave, onCancel }: { initial: Product; onSave: (p: Product) => Promise<void>; onCancel: () => void }) {
  const [p, setP] = useState<Product>(initial)
  const [errors, setErrors] = useState<ProductErrors>({})
  const [busy, setBusy] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadError, setUploadError] = useState('')
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }))
  const m = p.measurements ?? {}
  const setM = (k: keyof Measurements, v: string) => {
    const next = { ...m, [k]: num(v) }
    set('measurements', Object.values(next).some((x) => x !== undefined) ? next : null)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs = validateProduct(p)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    await onSave(p)
    setBusy(false)
  }

  return (
    <form className="admin-form" onSubmit={submit} aria-label="Edit shirt" noValidate>
      <h2>{initial.name || 'New shirt'}</h2>
      <p className="note">Leave size, condition, flaws, measurements and quantity blank until the shirt has been physically checked. Blank shows as &ldquo;Details to confirm&rdquo; to customers.</p>
      <div className="grid-form">
        <label className="field">SKU<input value={p.sku} onChange={(e) => set('sku', e.target.value)} />{errors.sku && <span className="error">{errors.sku}</span>}</label>
        <label className="field">Name<input value={p.name} onChange={(e) => set('name', e.target.value)} />{errors.name && <span className="error">{errors.name}</span>}</label>
        <label className="field">Category<select value={p.category} onChange={(e) => set('category', e.target.value as Product['category'])}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="field">Price (KES)<input inputMode="numeric" value={p.priceKes ?? ''} onChange={(e) => set('priceKes', e.target.value.trim() === '' ? null : Number(e.target.value))} placeholder="blank = standard KES 350" />{errors.priceKes && <span className="error">{errors.priceKes}</span>}</label>
        <label className="field">Verified size<input value={p.size ?? ''} onChange={(e) => set('size', e.target.value.trim() || null)} placeholder="e.g. M, L, 42" />{errors.size && <span className="error">{errors.size}</span>}</label>
        <label className="field">Condition<select value={p.condition ?? ''} onChange={(e) => set('condition', (e.target.value || null) as Product['condition'])}><option value="">Unverified</option>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="field">Stock quantity<input inputMode="numeric" value={p.quantity ?? ''} onChange={(e) => set('quantity', e.target.value.trim() === '' ? null : Number(e.target.value))} placeholder="blank = unverified" />{errors.quantity && <span className="error">{errors.quantity}</span>}</label>
        <label className="field">Status<select value={p.status} onChange={(e) => set('status', e.target.value as Product['status'])}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
        {(['chest', 'length', 'shoulder', 'sleeve'] as const).map((k) => (
          <label className="field" key={k}>{k[0].toUpperCase() + k.slice(1)} (cm)<input inputMode="decimal" value={m[k] ?? ''} onChange={(e) => setM(k, e.target.value)} /></label>
        ))}
      </div>
      {errors.measurements && <p className="error">{errors.measurements}</p>}
      <label className="field">Flaws (describe any stains, holes, fading… blank = not yet inspected)
        <textarea rows={2} value={p.flaws ?? ''} onChange={(e) => set('flaws', e.target.value === '' ? null : e.target.value)} />
      </label>
      <label className="check"><input type="checkbox" checked={p.flaws === ''} onChange={(e) => set('flaws', e.target.checked ? '' : null)} /> Inspected: no flaws found</label>
      <label className="field">Description<textarea rows={3} value={p.description} onChange={(e) => set('description', e.target.value)} />{errors.description && <span className="error">{errors.description}</span>}</label>
      <label className="check"><input type="checkbox" checked={p.featured} onChange={(e) => set('featured', e.target.checked)} /> Feature on the home page</label>

      <fieldset>
        <legend>Photos (real photos of this exact shirt only)</legend>
        <ul>{p.images.map((src, i) => <li key={src}><img src={src} alt="" width="40" /> {src} <button type="button" className="text-link" onClick={() => set('images', p.images.filter((_, j) => j !== i))}>Remove</button></li>)}</ul>
        <div className="inline">
          <input aria-label="Image URL" placeholder="https://… or /assets/…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <button type="button" className="secondary" onClick={() => { if (imageUrl.trim()) { set('images', [...p.images, imageUrl.trim()]); setImageUrl('') } }}>Add URL</button>
        </div>
        {supabase && (
          <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload photo" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try { set('images', [...p.images, await uploadImage(f)]); setUploadError('') } catch (err) { setUploadError(err instanceof Error ? err.message : 'Upload failed') }
          }} />
        )}
        {uploadError && <p className="error" role="alert">{uploadError}</p>}
        {errors.images && <p className="error">{errors.images}</p>}
      </fieldset>

      <div className="admin-actions">
        <button className="primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button className="secondary" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
