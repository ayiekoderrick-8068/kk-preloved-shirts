import { useState, type ImgHTMLAttributes } from 'react'
import { srcSetFor, staticSources } from '../lib/images'

/**
 * <img> with a neutral placeholder if the photo fails to load. Photos uploaded through the admin carry
 * resized variants, so they get a `srcset` automatically; the built-in shop photos get AVIF + WebP sources in
 * phone and full sizes. If a derived file is ever missing, the original photo is used instead of showing nothing.
 * Pass `sizes` to say how wide the image is displayed.
 */
export default function ProductImage({ alt, src, srcSet, sizes, className, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [original, setOriginal] = useState(false)
  if (failed || !src) {
    return (
      <span className="img-fallback" role="img" aria-label={alt}>
        Photo unavailable
      </span>
    )
  }
  const fixed = srcSet || original ? undefined : staticSources(src)
  const cls = [className, loaded ? 'is-loaded' : ''].filter(Boolean).join(' ') || undefined
  const img = (
    <img
      alt={alt}
      src={src}
      srcSet={original ? undefined : (srcSet ?? fixed?.webp ?? srcSetFor(src))}
      sizes={original ? undefined : sizes}
      className={cls}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => (staticSources(src) && !original ? setOriginal(true) : setFailed(true))}
      {...rest}
    />
  )
  if (!fixed) return img
  return (
    <picture>
      <source type="image/avif" srcSet={fixed.avif} sizes={sizes} />
      {img}
    </picture>
  )
}
