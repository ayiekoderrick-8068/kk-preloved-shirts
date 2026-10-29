import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../../context/ProductsContext'
import { isNewArrival, stockState } from '../../lib/inventory'
import { loadInquiries } from '../../lib/shopRepo'
import { STATUSES, STATUS_LABELS } from '../../lib/validate'

export default function Overview() {
  const { all, loading } = useProducts()
  const [newInquiries, setNewInquiries] = useState<number | null>(null)

  useEffect(() => {
    loadInquiries().then((list) => setNewInquiries(list.filter((i) => !i.handled).length), () => setNewInquiries(null))
  }, [])

  const stats = useMemo(() => {
    const counts = Object.fromEntries(STATUSES.map((s) => [s, all.filter((p) => p.status === s).length]))
    const live = all.filter((p) => p.status === 'available' || p.status === 'reserved')
    const unverified = live.filter((p) => p.size === null || p.condition === null || p.quantity === null || p.priceKes === null)
    const lastOne = live.filter((p) => stockState(p) === 'in_stock' && p.quantity === 1).length
    const recent = [...all].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)
    return { counts, unverified: unverified.length, lastOne, recent, newCount: all.filter((p) => isNewArrival(p)).length }
  }, [all])

  if (loading) return <p role="status">Loading…</p>

  return (
    <div className="overview">
      <div className="admin-actions">
        <Link to="/admin/products/new" className="primary">Add New Stock</Link>
        <Link to="/admin/inventory" className="secondary">Manage inventory</Link>
      </div>
      <ul className="stat-grid" aria-label="Stock summary">
        {STATUSES.map((s) => (
          <li key={s}>
            <strong>{stats.counts[s]}</strong>
            <span>{STATUS_LABELS[s]}</span>
          </li>
        ))}
        <li><strong>{stats.newCount}</strong><span>In New Arrivals</span></li>
        <li><strong>{newInquiries ?? '–'}</strong><span>New inquiries</span></li>
      </ul>

      {stats.unverified > 0 && (
        <p className="banner" role="note">
          {stats.unverified} live {stats.unverified === 1 ? 'item still has' : 'items still have'} an unconfirmed price, size, condition or quantity. Customers see “to confirm” on them. <Link to="/admin/inventory" className="text-link">Review in Inventory</Link>
        </p>
      )}

      <h3>Recently updated</h3>
      {stats.recent.length === 0 ? <p className="note">Nothing yet. Add your first item.</p> : (
        <ul className="recent-list">
          {stats.recent.map((p) => (
            <li key={p.id}>
              <Link to={`/admin/products/${p.id}`}>{p.name || '(unnamed draft)'}</Link>
              <span>{p.sku} · {STATUS_LABELS[p.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
