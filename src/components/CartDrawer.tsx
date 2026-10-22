import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useProducts } from '../context/ProductsContext'
import { config, hasWhatsApp } from '../lib/config'
import { formatKes, maxQuantity } from '../lib/inventory'
import { buildOrderMessage, buildWhatsAppUrl, validateCustomer, type CustomerErrors } from '../lib/order'
import type { CustomerDetails } from '../types'
import Modal from './Modal'
import ProductImage from './ProductImage'

const EMPTY: CustomerDetails = { fullName: '', phone: '', fulfillment: 'Delivery', location: '', notes: '', consent: false }

export default function CartDrawer() {
  const { lines, subtotal, isOpen, closeCart, setQty, remove, clear } = useCart()
  const { all } = useProducts()
  const [checkout, setCheckout] = useState(false)
  const [form, setForm] = useState<CustomerDetails>(EMPTY)
  const [errors, setErrors] = useState<CustomerErrors>({})
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const messageRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (lines.length === 0) {
       
      setCheckout(false)
      setMessage('')
    }
  }, [lines.length])

  const set = <K extends keyof CustomerDetails>(k: K, v: CustomerDetails[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      messageRef.current?.select()
      return false
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs = validateCustomer(form)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`field-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    const text = buildOrderMessage(lines, all, form, config.storeName)
    setMessage(text)
    if (hasWhatsApp) {
      window.open(buildWhatsAppUrl(config.whatsappNumber, text), '_blank', 'noopener')
      setStatus('WhatsApp should have opened with your request. Press send there. Your order is NOT confirmed until the shop replies.')
    } else {
      const ok = await copy(text)
      setStatus(
        ok
          ? 'WhatsApp ordering is not set up yet, so your request was copied. Send it to the shop yourself. It is NOT confirmed until the shop replies.'
          : 'WhatsApp ordering is not set up yet. Copy the text below and send it to the shop yourself. It is NOT confirmed until the shop replies.',
      )
    }
  }

  return (
    <Modal open={isOpen} onClose={closeCart} label="Shopping bag" variant="drawer">
      <div className="drawer-head">
        <h2>Your bag ({lines.reduce((n, l) => n + l.qty, 0)})</h2>
        <button type="button" className="x" onClick={closeCart} aria-label="Close bag">
          ×
        </button>
      </div>

      <div className="cart-list">
        {lines.length === 0 ? (
          <div className="empty">
            <p>Your bag is empty.</p>
            <Link to="/shop" className="text-link" onClick={closeCart}>
              Browse the shop
            </Link>
          </div>
        ) : (
          lines.map((l) => {
            const p = all.find((x) => x.id === l.productId)
            if (!p) return null
            const max = maxQuantity(p)
            return (
              <div className="cart-item" key={l.productId}>
                <ProductImage src={p.images[0]} alt="" />
                <div>
                  <Link to={`/shop/${p.id}`} onClick={closeCart}>
                    <strong>{p.name}</strong>
                  </Link>
                  <small>
                    {p.size ? `Size ${p.size}` : 'Size to confirm'} · {p.sku}
                  </small>
                  {max > 1 ? (
                    <label className="qty">
                      Qty
                      <select value={l.qty} onChange={(e) => setQty(p, Number(e.target.value))}>
                        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <small className="one-off">One-off piece</small>
                  )}
                  <button type="button" className="remove" onClick={() => remove(p.id)}>
                    Remove
                  </button>
                </div>
                <span className="price">{formatKes(p.priceKes * l.qty)}</span>
              </div>
            )
          })
        )}
      </div>

      {lines.length > 0 && (
        <div className="drawer-footer">
          <div className="totals">
            <span>Items subtotal</span>
            <span>{formatKes(subtotal)}</span>
          </div>
          <p className="note">Delivery fee to be confirmed by the shop. Nothing is charged online.</p>

          {!checkout ? (
            <button type="button" className="primary full" onClick={() => setCheckout(true)}>
              Continue to order details
            </button>
          ) : (
            <form onSubmit={submit} noValidate aria-label="Order details">
              <Field id="fullName" label="Full name *" error={errors.fullName}>
                <input id="field-fullName" data-autofocus value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" maxLength={80} aria-invalid={!!errors.fullName} />
              </Field>
              <Field id="phone" label="Phone number *" error={errors.phone}>
                <input id="field-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" maxLength={25} placeholder="0712 345 678" aria-invalid={!!errors.phone} />
              </Field>
              <Field id="fulfillment" label="Delivery or pickup *">
                <select id="field-fulfillment" value={form.fulfillment} onChange={(e) => set('fulfillment', e.target.value as CustomerDetails['fulfillment'])}>
                  <option>Delivery</option>
                  <option>Pickup</option>
                </select>
              </Field>
              <Field id="location" label={form.fulfillment === 'Delivery' ? 'Delivery town / estate *' : 'Pickup area or note *'} error={errors.location}>
                <input id="field-location" value={form.location} onChange={(e) => set('location', e.target.value)} maxLength={150} aria-invalid={!!errors.location} />
              </Field>
              <Field id="notes" label="Notes (optional)">
                <textarea id="field-notes" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={300} />
              </Field>
              <label className="check">
                <input id="field-consent" type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} aria-invalid={!!errors.consent} />
                <span>I agree to share these order details with {config.storeName} via WhatsApp.</span>
              </label>
              {errors.consent && <p className="error" role="alert">{errors.consent}</p>}
              <button type="submit" className="primary full">
                {hasWhatsApp ? 'Send request on WhatsApp' : 'Copy order request'}
              </button>
              {status && <p className="success" role="status">{status}</p>}
              {message && (
                <>
                  <textarea ref={messageRef} className="order-text" readOnly value={message} aria-label="Order request text" />
                  <button type="button" className="secondary full" onClick={async () => setStatus((await copy(message)) ? 'Copied to clipboard.' : 'Select the text above and copy it manually.')}>
                    Copy text
                  </button>
                  <button type="button" className="text-link" onClick={() => { clear(); setMessage(''); setStatus(''); setForm(EMPTY); setCheckout(false) }}>
                    I&apos;ve sent it - clear my bag
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      )}
    </Modal>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field" htmlFor={`field-${id}`}>
      {label}
      {children}
      {error && <span className="error" role="alert">{error}</span>}
    </label>
  )
}
