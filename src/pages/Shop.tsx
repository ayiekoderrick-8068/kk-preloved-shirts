import { useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import QuickView from '../components/QuickView'
import Seo from '../components/Seo'
import { useProducts } from '../context/ProductsContext'
import { DEFAULT_FILTERS, filterProducts, sortProducts, verifiedOptions, type Availability, type ProductFilters, type SortKey } from '../lib/inventory'
import { CATEGORIES } from '../lib/validate'
import type { Product } from '../types'

export default function Shop() {
  const { live, loading, error } = useProducts()
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortKey>('featured')
  const [quick, setQuick] = useState<Product | null>(null)

  const sizes = useMemo(() => verifiedOptions(live, 'size'), [live])
  const conditions = useMemo(() => verifiedOptions(live, 'condition'), [live])
  const results = useMemo(() => sortProducts(filterProducts(live, filters), sort), [live, filters, sort])
  const set = <K extends keyof ProductFilters>(k: K, v: ProductFilters[K]) => setFilters((f) => ({ ...f, [k]: v }))
  const active = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  return (
    <section className="section collection">
      <Seo title="Shop all pre-loved shirts" description="Browse every pre-loved shirt at KK Pre-Loved Shirts. Search, filter by category and availability, and sort by price." path="/shop" />
      <div className="section-heading">
        <div>
          <p className="eyebrow">The complete lineup</p>
          <h1>Shop all<span className="dot">.</span></h1>
        </div>
        <p>Each piece is one-off. Where a size or condition is not yet confirmed we say so rather than guess.</p>
      </div>

      <form className="toolbar" role="search" aria-label="Filter shirts" onSubmit={(e) => e.preventDefault()}>
        <label className="grow">
          <span className="label">Search</span>
          <input type="search" value={filters.query} onChange={(e) => set('query', e.target.value)} placeholder="Name, colour, SKU…" />
        </label>
        <label>
          <span className="label">Category</span>
          <select value={filters.category} onChange={(e) => set('category', e.target.value as ProductFilters['category'])}>
            <option value="all">All</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        {sizes.length > 0 && (
          <label>
            <span className="label">Size</span>
            <select value={filters.size} onChange={(e) => set('size', e.target.value)}>
              <option value="all">Any</option>
              {sizes.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        )}
        {conditions.length > 0 && (
          <label>
            <span className="label">Condition</span>
            <select value={filters.condition} onChange={(e) => set('condition', e.target.value)}>
              <option value="all">Any</option>
              {conditions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        )}
        <label>
          <span className="label">Availability</span>
          <select value={filters.availability} onChange={(e) => set('availability', e.target.value as Availability)}>
            <option value="all">All</option>
            <option value="available">Available / to confirm</option>
            <option value="sold">Sold</option>
          </select>
        </label>
        <label>
          <span className="label">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A-Z</option>
          </select>
        </label>
      </form>

      <p className="result-count" role="status" aria-live="polite">
        {loading ? 'Loading…' : `${results.length} ${results.length === 1 ? 'shirt' : 'shirts'}`}
      </p>

      {error && <p className="error" role="alert">We couldn&apos;t load the shirts: {error}</p>}

      {!loading && results.length === 0 ? (
        <div className="empty-state">
          <p>No shirts match those filters.</p>
          {active && <button type="button" className="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear filters</button>}
        </div>
      ) : (
        <div className="products">
          {results.map((p) => <ProductCard key={p.id} product={p} onQuickView={setQuick} />)}
        </div>
      )}
      <QuickView product={quick} onClose={() => setQuick(null)} />
    </section>
  )
}
