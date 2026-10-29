import { Link } from 'react-router-dom'
import { useProducts } from '../../context/ProductsContext'
import { priceLabel, stockLabel } from '../../lib/inventory'
import { STATUS_LABELS } from '../../lib/validate'

/** Visual catalogue of every product (newest first). Detailed stock work happens in Inventory. */
export default function ProductsList() {
  const { all, loading, source, importSeedProducts, resetDemoData } = useProducts()
  const sorted = [...all].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  return (
    <div>
      <div className="admin-actions">
        <h2 className="inline-title">Products ({all.length})</h2>
        <Link to="/admin/products/new" className="primary">Add New Stock</Link>
        {source === 'database' && all.length === 0 && !loading && (
          <button type="button" className="secondary" onClick={() => void importSeedProducts()}>Import the starter shirts</button>
        )}
        {source === 'demo' && <button type="button" className="text-link" onClick={() => resetDemoData()}>Reset demo data</button>}
      </div>
      {loading ? <p role="status">Loading…</p> : all.length === 0 ? <p className="note">No products yet. Click “Add New Stock” to add your first one.</p> : (
        <ul className="admin-products">
          {sorted.map((p) => (
            <li key={p.id}>
              {p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : <span className="no-photo">No photo</span>}
              <div className="admin-product-info">
                <strong>{p.name || '(unnamed draft)'}</strong>
                <span>{p.sku} · {p.category}</span>
                <span>{priceLabel(p)}{p.priceKes === null ? ' (standard)' : ''} · {stockLabel(p)}</span>
                <span className={`status-pill status-${p.status}`}>{STATUS_LABELS[p.status]}</span>
              </div>
              <div className="row-actions">
                <Link to={`/admin/products/${p.id}`} className="btn-small">Edit</Link>
                {(p.status === 'available' || p.status === 'reserved' || p.status === 'sold') && <Link to={`/shop/${p.id}`} target="_blank" className="btn-small">View</Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
