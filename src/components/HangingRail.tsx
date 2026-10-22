import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { priceLabel } from '../lib/inventory'
import type { Product } from '../types'
import ProductImage from './ProductImage'

/**
 * The signature hanging-shirt rail: shirts hang from a rod on strings. Drag with a mouse, swipe on touch,
 * use the arrow keys, or the prev/next buttons.
 */
export default function HangingRail({ products }: { products: Product[] }) {
  const navigate = useNavigate()
  const rail = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, left: 0, moved: false })
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  const itemWidth = () => rail.current?.firstElementChild?.getBoundingClientRect().width || 1

  const onScroll = useCallback(() => {
    const el = rail.current
    if (!el) return
    const step = itemWidth() + 24
    setIndex(Math.min(Math.round(el.scrollLeft / step), Math.max(products.length - 1, 0)))
    setProgress(Math.min(1, (el.scrollLeft + el.clientWidth) / Math.max(el.scrollWidth, 1)))
  }, [products.length])

  useEffect(() => {
    onScroll()
  }, [onScroll])

  const step = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * (itemWidth() + 24), behavior: 'smooth' })

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !rail.current) return
    drag.current = { active: true, startX: e.clientX, left: rail.current.scrollLeft, moved: false }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d.active || !rail.current) return
    if (Math.abs(d.startX - e.clientX) > 6) d.moved = true
    if (d.moved) rail.current.scrollLeft = d.left + d.startX - e.clientX
  }
  const endDrag = () => {
    drag.current.active = false
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="hero-visual">
      <div className="rod" aria-hidden="true" />
      <div className="rail-head">
        <span>THE HANGING EDIT - {products.length} PIECES</span>
        <div className="rail-controls">
          <button type="button" className="circle" aria-label="Previous shirts" onClick={() => step(-1)}>
            ←
          </button>
          <button type="button" className="circle" aria-label="Next shirts" onClick={() => step(1)}>
            →
          </button>
        </div>
      </div>
      <div
        ref={rail}
        className="rail-scroll"
        role="region"
        aria-label="Hanging shirt rail. Use left and right arrow keys to browse."
        tabIndex={0}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => {
          // A drag must not count as a click on the shirt underneath.
          if (drag.current.moved) {
            e.preventDefault()
            e.stopPropagation()
            drag.current.moved = false
          }
        }}
      >
        {products.map((p) => {
          return (
            <div key={p.id} className="hanger">
              <svg className="hook" width="26" height="22" viewBox="0 0 26 22" fill="none" aria-hidden="true">
                <path d="M13 21V13m0 0c-3-1-4-4-1.5-5.5C13.500 6 16 7.500 15.500 10" stroke="#1d1d1a" strokeWidth="1.600" strokeLinecap="round" />
                <circle cx="13" cy="3" r="2.200" fill="#1d1d1a" />
              </svg>
              <button type="button" className="hanger-card" aria-label={`View ${p.name}`} onClick={() => navigate(`/shop/${p.id}`)} draggable={false}>
                <span className="hanger-photo">
                  <ProductImage src={p.images[0]} alt="" loading="lazy" draggable={false} />
                </span>
                <span className="hanger-info">
                  <span className="hanger-name">{p.name}</span>
                  <span className="hanger-price">{priceLabel(p)}</span>
                </span>
                <span className="hanger-kind">
                  {p.category} · {p.size ? `Size ${p.size}` : 'Size to confirm'}
                </span>
              </button>
            </div>
          )
        })}
      </div>
      <div className="rail-bottom">
        <span className="rail-hint">
          <span aria-hidden="true">←</span> DRAG, SWIPE OR USE ARROW KEYS <span aria-hidden="true">→</span>
        </span>
        <span className="rail-track" aria-hidden="true">
          <span className="rail-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </span>
        <span aria-live="off" className="rail-count">
          {pad(Math.min(index + 1, products.length))} / {pad(products.length)}
        </span>
      </div>
    </div>
  )
}
