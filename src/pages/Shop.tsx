import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import QuickView from '../components/QuickView'
import Seo from '../components/Seo'
import { useProducts } from '../context/ProductsContext'
import { useSettings } from '../context/SettingsContext'
import { pairDealText } from '../lib/pricing'
import { DEFAULT_FILTERS, filterProducts, sortProducts, verifiedOptions, type Availability, type ProductFilters, type SortKey } from '../lib/inventory'
import type { Product } from '../types'

const PAGE_SIZE = 24
const SORTS: SortKey[] = ['newest', 'featured', 'price-asc', 'price-desc', 'name']

export default function Shop() {
  const { live, categories, loading, error } = useProducts()
  const { settings } = useSettings()
  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState<ProductFilters>(() => ({ ...DEFAULT_FILTERS, category: params.get('category') ?? 'all' }))
  const [quick, setQuick] = useState<Product | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const sortParam = params.get('sort') as SortKey | null
  const sort: SortKey = sortParam && SORTS.includes(sortParam) ? sortParam : 'newest'
  const setSort = (s: SortKey) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('sort', s); return n }, { replace: true })

  const sizes = useMemo(() => verifiedOptions(live, 'size'), [live])
  const conditions = useMemo(() => verifiedOptions(live, 'condition'), [live])
  const searchRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const focusToken = (location.state as { focusSearch?: number } | null)?.focusSearch

  // The header's search icon lands here and focuses the search box.
  useEffect(() => {
    if (focusToken) searchRef.current?.focus()
  }, [focusToken])

  const results = useMemo(() => sortProducts(filterProducts(live, filters), sort), [live, filters, sort])
  const shown = results.slice(0, visible)
  const set = <K extends keyof ProductFilters>(k: K, v: ProductFilters[K]) => {
    setFilters((f) => ({ ...f, [k]: v }))
    setVisible(PAGE_SIZE)
  }
  const active = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  return (
    <section className="section collection">
      <Seo title="Shop all pre-loved clothing" description={`Browse every pre-loved piece at ${settings.shopName}. Search, filter by category and availability, and sort by price.`} path="/shop" />
      <div className="section-heading">
        <div>
          <p className="eyebrow">The complete lineup</p>
          <h1>Shop all<span className="dot">.</span></h1>
        </div>
        <p>
          <strong>{pairDealText()}.</strong> Each piece is one-off. Where a size or condition is not yet confirmed we say so rather than guess.
        </p>
      </div>

      <form className="toolbar" role="search" aria-label="Filter items" onSubmit={(e) => e.preventDefault()}>
        <label className="grow">
          <span className="label">Search</span>
          <input ref={searchRef} type="search" value={filters.query} onChange={(e) => set('query', e.target.value)} placeholder="Name, colour, brand, SKU…" />
        </label>
        <label>
          <span className="label">Category</span>
          <select value={filters.category} onChange={(e) => set('category', e.target.value)}>
            <option value="all">All</option>
            {categories.map((c) => <option key={c.id}>{c.name}</option>)}
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
            <option value="newest">Newest first</option>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A-Z</option>
          </select>
        </label>
      </form>

      <p className="result-count" role="status" aria-live="polite">
        {loading ? 'Loading…' : `${results.length} ${results.length === 1 ? 'item' : 'items'}`}
      </p>

      {error && <p className="error" role="alert">We couldn&apos;t load the items: {error}</p>}

      {!loading && results.length === 0 ? (
        <div className="empty-state">
          <p>No items match those filters.</p>
          {active && <button type="button" className="secondary" onClick={() => { setFilters(DEFAULT_FILTERS); setVisible(PAGE_SIZE) }}>Clear filters</button>}
        </div>
      ) : (
        <div className="products">
          {shown.map((p, i) => <ProductCard key={p.id} product={p} onQuickView={setQuick} priority={i < 4} />)}
        </div>
      )}
      {results.length > shown.length && (
        <div className="load-more">
          <button type="button" className="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Show more ({results.length - shown.length} more)
          </button>
        </div>
      )}
      <QuickView product={quick} onClose={() => setQuick(null)} />
    </section>
  )
}
