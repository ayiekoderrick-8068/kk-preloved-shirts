import { Link } from 'react-router-dom'
import HangingRail from '../components/HangingRail'
import ProductCard from '../components/ProductCard'
import QuickView from '../components/QuickView'
import Seo from '../components/Seo'
import { useProducts } from '../context/ProductsContext'
import { pickHomepage } from '../lib/home'
import { stockState } from '../lib/inventory'
import { pairDealText } from '../lib/pricing'
import { useMemo, useState } from 'react'
import type { Product } from '../types'

export default function Home() {
  const { live, loading, error } = useProducts()
  const [quick, setQuick] = useState<Product | null>(null)
  const rail = live.filter((p) => stockState(p) !== 'sold')
  const { featured, collage } = useMemo(() => pickHomepage(live), [live])

  return (
    <>
      <Seo
        title="Pre-loved men's shirts, one of a kind"
        description="KK Pre-Loved Shirts - curated pre-loved men's shirts from the best thrifts. Unique one-of-a-kind pieces, priced in KES, ordered over WhatsApp."
      />
      <section className="section hero">
        <div className="hero-content">
          <p className="eyebrow">01 / The shirt rail</p>
          <h1>
            Pre-loved. <br />
            One of <em>one.</em>
          </h1>
          <p className="hero-desc">Curated pre-loved men&apos;s shirts from the best thrifts: unique pieces that blend style, comfort and sustainability. Browse the rail, pick your hidden gem and send your request on WhatsApp.</p>
          <Link to="/shop" className="primary">
            Shop all <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {loading ? <div className="hero-visual rail-status">Loading the rail…</div> : error ? <div className="hero-visual rail-status" role="alert">We couldn&apos;t load the shirts right now. Please refresh.</div> : <HangingRail products={rail} />}
      </section>

      <section className="feature-strip" aria-label="How ordering works">
        <div className="section feature-grid">
          <div className="feature"><span aria-hidden="true">1</span> Pick your pieces: {pairDealText()}</div>
          <div className="feature"><span aria-hidden="true">2</span> Send your request on WhatsApp</div>
          <div className="feature"><span aria-hidden="true">3</span> The shop confirms size, availability and delivery</div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section spotlight">
          <div className="section-heading">
            <div>
              <p className="eyebrow">In the spotlight</p>
              <h2>Picked for you<span className="dot">.</span></h2>
            </div>
            <Link to="/shop" className="text-link">See all {live.length} shirts</Link>
          </div>
          <div className="products">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setQuick} />
            ))}
          </div>
        </section>
      )}

      <section className="editorial">
        <div className="editorial-copy">
          <p className="eyebrow">Why pre-loved</p>
          <h2>Good shirts,<br />second time round.</h2>
          <p>Each shirt is a unique piece. Sizes, measurements and condition are listed per item so you know exactly what you are getting.</p>
          <Link to="/shop" className="secondary">Browse the shop ↗</Link>
        </div>
        <div className="editorial-visual collage">
          {collage.map((p, i) => (
            <img key={p.id} className={`collage-${i + 1}`} src={p.images[0]} alt={p.name} loading="lazy" />
          ))}
        </div>
      </section>
      <QuickView product={quick} onClose={() => setQuick(null)} />
    </>
  )
}
