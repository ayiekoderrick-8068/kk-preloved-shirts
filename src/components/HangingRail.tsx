import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../types'
import ProductImage from './ProductImage'

/** The signature hanging-shirt rail: drag with a mouse, swipe on touch, arrow keys, or the prev/next buttons. */
export default function HangingRail({ products }: { products: Product[] }) {
  const navigate = useNavigate()
  const rail = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, left: 0, moved: false })
  const [index, setIndex] = useState(0)

  const itemWidth = () => rail.current?.firstElementChild?.getBoundingClientRect().width || 1

  const onScroll = useCallback(() => {
    const el = rail.current
    if (el) setIndex(Math.min(Math.round(el.scrollLeft / itemWidth()), Math.max(products.length - 1, 0)))
  }, [products.length])

  useEffect(() => {
    onScroll()
  }, [onScroll])

  const step = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * itemWidth(), behavior: 'smooth' })

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

  return (
    <div className="hero-visual">
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
        {products.map((p) => (
          <button key={p.id} type="button" className="hanger" aria-label={`View ${p.name}`} onClick={() => navigate(`/shop/${p.id}`)} draggable={false}>
            <ProductImage src={p.images[0]} alt="" loading="lazy" draggable={false} />
          </button>
        ))}
      </div>
      <div className="rail-bottom">
        <span>← DRAG, SWIPE OR USE ARROW KEYS →</span>
        <span aria-live="off">
          {String(Math.min(index + 1, products.length)).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
