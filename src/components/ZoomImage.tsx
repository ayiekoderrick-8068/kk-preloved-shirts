import { useState, type PointerEvent } from 'react'
import ProductImage from './ProductImage'

/** Product photo that zooms to 2.2x on click/tap and pans with the pointer. Keyboard: Enter/Space toggles. */
export default function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')

  const track = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
  }

  return (
    <button
      type="button"
      className={`zoom${zoomed ? ' is-zoomed' : ''}`}
      aria-pressed={zoomed}
      aria-label={zoomed ? `Zoom out of ${alt}` : `Zoom in on ${alt}`}
      onClick={() => setZoomed((z) => !z)}
      onPointerMove={zoomed ? track : undefined}
      onPointerDown={track}
      onBlur={() => setZoomed(false)}
    >
      <span className="zoom-inner" style={zoomed ? { transform: 'scale(2.2)', transformOrigin: origin } : undefined}>
        <ProductImage src={src} alt={alt} sizes="(max-width: 760px) 100vw, 50vw" />
      </span>
      {!zoomed && <span className="zoom-hint" aria-hidden="true">Tap to zoom</span>}
    </button>
  )
}
