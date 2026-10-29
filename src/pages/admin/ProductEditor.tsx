import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import PriceBlock from '../../components/PriceBlock'
import ProductCard from '../../components/ProductCard'
import ProductSpecs from '../../components/ProductSpecs'
import StockBadge from '../../components/StockBadge'
import { useProducts } from '../../context/ProductsContext'
import { nextSku } from '../../lib/sku'
import { CONDITIONS, STATUSES, STATUS_LABELS, validateProduct, type ProductErrors } from '../../lib/validate'
import type { Measurements, Product } from '../../types'
import ImageUploader from './ImageUploader'

function blankProduct(skus: string[], category: string): Product {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    sku: nextSku(skus),
    name: '',
    category,
    description: '',
    priceKes: null,
    originalPriceKes: null,
    discountPriceKes: null,
    size: null,
    color: null,
    brand: null,
    measurements: null,
    condition: null,
    flaws: null,
    details: null,
    quantity: 1,
    status: 'available',
    images: [],
    featured: false,
    newArrival: false,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

export default function ProductEditor() {
  const { id } = useParams()
  const { all, categories, loading } = useProducts()
  const location = useLocation()
  if (loading) return <p role="status">Loading…</p>
  const existing = id ? all.find((p) => p.id === id) : undefined
  if (id && !existing) return <p role="alert">That product could not be found. <Link to="/admin/products" className="text-link">Back to products</Link></p>
  // key resets the form when switching products; for a new product each visit (location.key) starts a blank form
  return <EditorForm key={existing?.id ?? location.key} initial={existing ?? blankProduct(all.map((p) => p.sku), categories[0]?.name ?? '')} isNew={!existing} />
}

const num = (s: string): number | undefined => (s.trim() === '' ? undefined : Number(s))
const intOrNull = (s: string): number | null => (s.trim() === '' ? null : Number(s))

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

function EditorForm({ initial, isNew }: { initial: Product; isNew: boolean }) {
  const { all, categories, save } = useProducts()
  const navigate = useNavigate()
  const [p, setP] = useState<Product>(initial)
  const [errors, setErrors] = useState<ProductErrors>({})
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState<Product | null>(null)
  const [preview, setPreview] = useState(false)
  const wasDraft = initial.status === 'draft'

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }))
  const m = p.measurements ?? {}
  const setM = (k: keyof Measurements, v: string) => {
    const next = { ...m, [k]: num(v) }
    set('measurements', Object.values(next).some((x) => x !== undefined) ? next : null)
  }
  const err = (k: keyof Product) => errors[k]
  const a11y = (k: keyof Product) => ({ id: `field-${k}`, 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `error-${k}` : undefined })

  async function submit(mode: 'draft' | 'publish' | 'save') {
    const next: Product = {
      ...p,
      status: mode === 'draft' ? 'draft' : p.status === 'draft' ? 'available' : p.status,
      name: p.name.trim(),
      sku: p.sku.trim(),
    }
    const errs = validateProduct(next, { categories: categories.map((c) => c.name), others: all })
    setErrors(errs)
    setSaveError('')
    const first = Object.keys(errs)[0]
    if (first) {
      document.getElementById(`field-${first}`)?.focus()
      return
    }
    setBusy(true)
    try {
      await save(next)
      setP(next)
      setSaved(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit(isNew || wasDraft ? 'publish' : 'save')
  }

  const livePublished = saved && saved.status !== 'draft' && saved.status !== 'archived'

  return (
    <form className="admin-form editor" onSubmit={onSubmit} aria-label={isNew ? 'Add new stock' : 'Edit product'} noValidate>
      <h2>{isNew ? 'Add new stock' : initial.name || 'Edit product'}</h2>

      {saved && (
        <div className="saved-panel" role="status">
          <p>
            <strong>✓ {saved.status === 'draft' ? 'Draft saved.' : livePublished && (isNew || wasDraft) ? 'Published.' : 'Saved.'}</strong>{' '}
            {saved.status === 'draft'
              ? `“${saved.name || saved.sku}” is not visible to customers until you publish it.`
              : livePublished
                ? `“${saved.name}” is live in the shop${saved.publishedAt && Date.now() - new Date(saved.publishedAt).getTime() < 60_000 ? ' and listed under New Arrivals' : ''}.`
                : `“${saved.name}” is saved (${STATUS_LABELS[saved.status]}), so it is hidden from the shop.`}
          </p>
          <div className="admin-actions">
            {livePublished && <Link to={`/shop/${saved.id}`} className="secondary" target="_blank">View in shop</Link>}
            <button type="button" className="secondary" onClick={() => navigate('/admin/products/new', { replace: true, state: { again: Date.now() } })}>Add another</button>
            <Link to="/admin/products" className="text-link">Back to products</Link>
          </div>
        </div>
      )}
      {saveError && <p className="error banner-error" role="alert">{saveError}</p>}
      {Object.keys(errors).length > 0 && <p className="error" role="alert">Please fix the {Object.keys(errors).length} highlighted {Object.keys(errors).length === 1 ? 'field' : 'fields'} below.</p>}

      <p className="note">Required to publish: name, category, price, size, colour, condition, quantity, description and at least one photo. A draft only needs a name and SKU.</p>

      <div className="grid-form">
        <Field name="name" label="Product name *" error={err('name')}>
          <input {...a11y('name')} value={p.name} onChange={(e) => set('name', e.target.value)} maxLength={120} autoComplete="off" />
        </Field>
        <Field name="category" label="Category *" error={err('category')}>
          <select {...a11y('category')} value={p.category} onChange={(e) => set('category', e.target.value)}>
            {!categories.some((c) => c.name === p.category) && <option value={p.category}>{p.category || 'Choose…'}</option>}
            {categories.map((c) => <option key={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field name="priceKes" label="Selling price (KES) *" error={err('priceKes')} hint={initial.priceKes === null && !isNew ? 'Blank = shop standard price (KES 350, 2 for KES 600)' : undefined}>
          <input {...a11y('priceKes')} inputMode="numeric" value={p.priceKes ?? ''} onChange={(e) => set('priceKes', intOrNull(e.target.value))} placeholder="e.g. 1500" />
        </Field>
        <Field name="sku" label="SKU (unique) *" error={err('sku')}>
          <input {...a11y('sku')} value={p.sku} onChange={(e) => set('sku', e.target.value)} maxLength={24} autoComplete="off" />
        </Field>
        <Field name="size" label="Size *" error={err('size')}>
          <input {...a11y('size')} value={p.size ?? ''} onChange={(e) => set('size', e.target.value.trim() || null)} placeholder="e.g. M, L, 42" maxLength={16} />
        </Field>
        <Field name="color" label="Colour *" error={err('color')}>
          <input {...a11y('color')} value={p.color ?? ''} onChange={(e) => set('color', e.target.value.trim() ? e.target.value : null)} placeholder="e.g. Navy blue" maxLength={40} />
        </Field>
        <Field name="brand" label="Brand (if known)" error={err('brand')}>
          <input {...a11y('brand')} value={p.brand ?? ''} onChange={(e) => set('brand', e.target.value.trim() ? e.target.value : null)} maxLength={60} />
        </Field>
        <Field name="condition" label="Condition *" error={err('condition')}>
          <select {...a11y('condition')} value={p.condition ?? ''} onChange={(e) => set('condition', (e.target.value || null) as Product['condition'])}>
            <option value="">Choose…</option>
            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field name="quantity" label="Quantity *" error={err('quantity')} hint="1 for a one-off thrift piece">
          <input {...a11y('quantity')} type="number" min={0} max={999} step={1} inputMode="numeric" value={p.quantity ?? ''} onChange={(e) => set('quantity', intOrNull(e.target.value))} />
        </Field>
        <Field name="status" label="Availability status *" error={err('status')} hint={p.status === 'draft' ? 'Publish will make it Available' : undefined}>
          <select {...a11y('status')} value={p.status} onChange={(e) => set('status', e.target.value as Product['status'])}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </Field>
        <Field name="originalPriceKes" label="Original price (KES)" error={err('originalPriceKes')} hint="Optional. Shown crossed out">
          <input {...a11y('originalPriceKes')} inputMode="numeric" value={p.originalPriceKes ?? ''} onChange={(e) => set('originalPriceKes', intOrNull(e.target.value))} />
        </Field>
        <Field name="discountPriceKes" label="Discount price (KES)" error={err('discountPriceKes')} hint="Optional. Customers pay this">
          <input {...a11y('discountPriceKes')} inputMode="numeric" value={p.discountPriceKes ?? ''} onChange={(e) => set('discountPriceKes', intOrNull(e.target.value))} />
        </Field>
      </div>

      <Field name="description" label="Product description *" error={err('description')}>
        <textarea {...a11y('description')} rows={3} value={p.description} onChange={(e) => set('description', e.target.value)} maxLength={1000} />
      </Field>

      <ImageUploader images={p.images} onChange={(images) => set('images', images)} error={err('images')} />

      <details className="more" open={!!(p.measurements || p.flaws || p.details)}>
        <summary>More garment details (optional)</summary>
        <div className="grid-form">
          {(['chest', 'length', 'shoulder', 'sleeve'] as const).map((k) => (
            <div className="field" key={k}>
              <label htmlFor={`field-m-${k}`}>{k[0].toUpperCase() + k.slice(1)} (cm, laid flat)</label>
              <input id={`field-m-${k}`} inputMode="decimal" value={m[k] ?? ''} onChange={(e) => setM(k, e.target.value)} />
            </div>
          ))}
        </div>
        {err('measurements') && <p className="error">{err('measurements')}</p>}
        <Field name="flaws" label="Flaws (stains, holes, fading… blank = not yet inspected)">
          <textarea {...a11y('flaws')} rows={2} value={p.flaws ?? ''} onChange={(e) => set('flaws', e.target.value === '' ? null : e.target.value)} />
        </Field>
        <label className="check"><input type="checkbox" checked={p.flaws === ''} onChange={(e) => set('flaws', e.target.checked ? '' : null)} /> Inspected: no flaws found</label>
        <Field name="details" label="Additional garment details (fabric, fit, care…)" error={err('details')}>
          <textarea {...a11y('details')} rows={2} value={p.details ?? ''} onChange={(e) => set('details', e.target.value === '' ? null : e.target.value)} maxLength={1000} />
        </Field>
      </details>

      <label className="check"><input type="checkbox" checked={p.featured} onChange={(e) => set('featured', e.target.checked)} /> Feature on the home page</label>
      <label className="check"><input type="checkbox" checked={p.newArrival} onChange={(e) => set('newArrival', e.target.checked)} /> Always mark as “New arrival” (otherwise it is new for 30 days after publishing)</label>

      {preview && (
        <div className="preview" aria-label="Preview">
          <h3>Preview: how customers will see it</h3>
          <div className="preview-grid">
            <div className="preview-card"><ProductCard product={p} onQuickView={() => undefined} /></div>
            <div className="detail-info">
              <h2>{p.name || 'Product name'}</h2>
              <PriceBlock product={p} />
              <StockBadge product={p} />
              {p.description && <p>{p.description}</p>}
              <ProductSpecs product={p} />
            </div>
          </div>
        </div>
      )}

      <div className="admin-actions sticky-actions">
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : isNew || wasDraft ? 'Publish' : 'Save changes'}
        </button>
        {(isNew || wasDraft) && <button className="secondary" type="button" disabled={busy} onClick={() => void submit('draft')}>Save draft</button>}
        {!isNew && !wasDraft && p.status !== 'draft' && <button className="secondary" type="button" disabled={busy} onClick={() => void submit('draft')}>Unpublish to draft</button>}
        <button className="secondary" type="button" onClick={() => setPreview((v) => !v)} aria-pressed={preview}>{preview ? 'Hide preview' : 'Preview'}</button>
        <Link to="/admin/products" className="text-link">Cancel</Link>
      </div>
    </form>
  )
}
