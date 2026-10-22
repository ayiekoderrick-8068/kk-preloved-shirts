import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AddToBagButton from '../components/AddToBagButton'
import ProductCard from '../components/ProductCard'
import ProductImage from '../components/ProductImage'
import ProductSpecs from '../components/ProductSpecs'
import QuickView from '../components/QuickView'
import Seo from '../components/Seo'
import StockBadge from '../components/StockBadge'
import { useProducts } from '../context/ProductsContext'
import { config } from '../lib/config'
import { formatKes, priceLabel, relatedProducts } from '../lib/inventory'
import type { Product } from '../types'
import NotFound from './NotFound'

export default function ProductPage() {
  const { id } = useParams()
  const { all, live, loading } = useProducts()
  const [imgIndex, setImgIndex] = useState(0)
  const [quick, setQuick] = useState<Product | null>(null)

  if (loading) return <section className="section collection"><p role="status">Loading…</p></section>
  const p = live.find((x) => x.id === id)
  if (!p) return <NotFound message="That shirt isn't listed any more." />

  const related = relatedProducts(all.filter((x) => x.status !== 'archived'), p)
  const image = p.images[Math.min(imgIndex, p.images.length - 1)]

  return (
    <>
      <Seo title={p.name} description={`${p.name} - pre-loved ${p.category.toLowerCase()} men's shirt, ${priceLabel(p).toLowerCase() === 'price to confirm' ? 'price on request' : priceLabel(p)}. ${p.description}`.trim()} path={`/shop/${p.id}`} image={p.images[0]} />
      <article className="section product-page">
        <nav aria-label="Breadcrumb" className="crumbs">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span aria-current="page">{p.name}</span>
        </nav>
        <div className="product-layout">
          <div className="gallery">
            <div className="detail-picture"><ProductImage src={image} alt={p.name} /></div>
            {p.images.length > 1 && (
              <div className="thumbs" role="group" aria-label="Product photos">
                {p.images.map((src, i) => (
                  <button key={src} type="button" aria-pressed={i === imgIndex} aria-label={`Photo ${i + 1} of ${p.images.length}`} onClick={() => setImgIndex(i)}>
                    <ProductImage src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="detail-info">
            <p className="eyebrow">{p.category}</p>
            <h1>{p.name}</h1>
            <div className={`price big${p.priceKes === null ? ' tbc' : ''}`}>{priceLabel(p)}</div>
            <StockBadge product={p} />
            {p.description && <p>{p.description}</p>}
            <ProductSpecs product={p} />
            <AddToBagButton product={p} />
            <p className="note">
              {p.size === null || p.quantity === null
                ? 'The shop will confirm size and availability when you send your order request. '
                : ''}
              Booking is {formatKes(config.bookingFeeKes)} per item (Pochi la Biashara {config.pochiNumber}) once the shop confirms. Delivery fee is confirmed separately. No payment is taken on this website.
            </p>
            <details className="delivery">
              <summary>Delivery &amp; returns</summary>
              <p>{config.deliveryInfo || 'Delivery locations, fees and timing are confirmed by the shop when it replies to your request.'}</p>
              <p>{config.returnsPolicy || 'Please ask the shop about returns or exchanges before you pay.'}</p>
            </details>
          </div>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="related">
            <h2 id="related-heading">You may also like</h2>
            <div className="products">
              {related.map((r) => <ProductCard key={r.id} product={r} onQuickView={setQuick} />)}
            </div>
          </section>
        )}
      </article>
      <QuickView product={quick} onClose={() => setQuick(null)} />
    </>
  )
}
