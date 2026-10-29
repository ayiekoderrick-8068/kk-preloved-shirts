import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../../context/ProductsContext'
import { useToast } from '../../context/ToastContext'
import { priceLabel } from '../../lib/inventory'
import { STATUSES, STATUS_LABELS } from '../../lib/validate'
import type { Product, ProductStatus } from '../../types'

/**
 * Searchable stock table. Quantity, price and status can be changed in place; every change is saved to the
 * database straight away. Setting the quantity to 0 or the status to Sold out makes the item show as sold out.
 */
export default function Inventory() {
  const { all, categories, save, remove, loading } = useProducts()
  const notify = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<'all' | ProductStatus>('all')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((p) => {
      if (q && !`${p.name} ${p.sku} ${p.color ?? ''} ${p.brand ?? ''}`.toLowerCase().includes(q)) return false
      if (category !== 'all' && p.category !== category) return false
      if (status !== 'all' && p.status !== status) return false
      return true
    })
  }, [all, query, category, status])

  const change = async (next: Product, done: string) => {
    setError('')
    try {
      await save(next)
      notify(done)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the change.')
    }
  }

  const setQty = (p: Product, raw: string) => {
    const qty = raw.trim() === '' ? null : Math.floor(Number(raw))
    if (qty !== null && (!Number.isFinite(qty) || qty < 0 || qty > 999)) return setError('Quantity must be a whole number from 0 to 999. It cannot be negative.')
    void change({ ...p, quantity: qty, status: qty === 0 && p.status === 'available' ? 'sold' : p.status }, `${p.name}: quantity updated.`)
  }

  const setPrice = (p: Product, raw: string) => {
    const price = raw.trim() === '' ? null : Number(raw)
    if (price !== null && (!Number.isInteger(price) || price <= 0 || price > 1_000_000)) return setError('Enter a whole-number price in KES.')
    if (price === p.priceKes) return
    if (p.discountPriceKes !== null && (price === null || p.discountPriceKes >= price)) return setError('Remove or lower the discount price first (edit the product).')
    void change({ ...p, priceKes: price }, `${p.name}: price updated.`)
  }

  return (
    <div>
      <h2>Inventory</h2>
      <form className="toolbar" role="search" aria-label="Filter inventory" onSubmit={(e) => e.preventDefault()}>
        <label className="grow"><span className="label">Search</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, SKU, colour, brand…" /></label>
        <label><span className="label">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            {categories.map((c) => <option key={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label><span className="label">Availability</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | ProductStatus)}>
            <option value="all">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </label>
      </form>
      <p className="result-count" role="status" aria-live="polite">{loading ? 'Loading…' : `${rows.length} of ${all.length} products`}</p>
      {error && <p className="error" role="alert">{error}</p>}

      <div className="table-wrap">
        <table className="inventory-table">
          <thead>
            <tr><th>SKU</th><th>Name</th><th>Price (KES)</th><th>Qty</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={`${p.id}:${p.updatedAt}`}>
                <td>{p.sku}</td>
                <td className="wrap">{p.name || '(unnamed draft)'}</td>
                <td>
                  <input
                    className="cell-input"
                    aria-label={`Price for ${p.name || p.sku} (${priceLabel(p)})`}
                    inputMode="numeric"
                    defaultValue={p.priceKes ?? ''}
                    placeholder="std"
                    onBlur={(e) => setPrice(p, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  />
                </td>
                <td>
                  <input
                    className="cell-input narrow"
                    type="number"
                    min={0}
                    max={999}
                    step={1}
                    aria-label={`Quantity for ${p.name || p.sku}`}
                    defaultValue={p.quantity ?? ''}
                    placeholder="?"
                    onBlur={(e) => e.target.value !== String(p.quantity ?? '') && setQty(p, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  />
                </td>
                <td>
                  <select
                    className="cell-input"
                    aria-label={`Status for ${p.name || p.sku}`}
                    value={p.status}
                    onChange={(e) => {
                      const next = e.target.value as ProductStatus
                      // Sold out means none left; coming back from sold out needs at least one to sell.
                      const quantity = next === 'sold' ? 0 : p.quantity === 0 && (next === 'available' || next === 'reserved') ? 1 : p.quantity
                      void change({ ...p, status: next, quantity }, `${p.name}: marked ${STATUS_LABELS[next].toLowerCase()}.`)
                    }}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </td>
                <td className="row-actions">
                  <Link to={`/admin/products/${p.id}`} className="btn-small">Edit</Link>
                  {p.status !== 'sold' && <button type="button" onClick={() => void change({ ...p, status: 'sold', quantity: 0 }, `${p.name} marked sold out.`)}>Mark sold out</button>}
                  {p.status === 'available' && <button type="button" onClick={() => void change({ ...p, status: 'reserved' }, `${p.name} reserved.`)}>Reserve</button>}
                  {p.status !== 'archived' ? (
                    <button type="button" onClick={() => void change({ ...p, status: 'archived' }, `${p.name} archived.`)}>Archive</button>
                  ) : (
                    <button type="button" onClick={() => void change({ ...p, status: 'available', quantity: p.quantity === 0 ? 1 : p.quantity }, `${p.name} restored.`)}>Restore</button>
                  )}
                  <button type="button" className="danger" onClick={() => setConfirmDelete(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <div className="confirm" role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
          <h3 id="confirm-title">Delete “{confirmDelete.name || confirmDelete.sku}”?</h3>
          <p id="confirm-desc">This permanently removes the product. If you only want to hide it, use Archive instead. This cannot be undone.</p>
          <div className="admin-actions">
            <button
              type="button"
              className="primary danger-btn"
              onClick={async () => {
                const target = confirmDelete
                setConfirmDelete(null)
                try {
                  await remove(target.id)
                  notify(`${target.name || target.sku} deleted.`)
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not delete.')
                }
              }}
            >
              Yes, delete it
            </button>
            <button type="button" className="secondary" onClick={() => setConfirmDelete(null)}>Keep it</button>
          </div>
        </div>
      )}
    </div>
  )
}
