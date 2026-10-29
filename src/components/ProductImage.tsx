import { useState, type ImgHTMLAttributes } from 'react'
import { srcSetFor } from '../lib/images'

/**
 * <img> with a neutral placeholder if the photo fails to load. Photos uploaded through the admin carry
 * resized variants, so they get a `srcset` automatically; pass `sizes` to say how wide the image is displayed.
 */
export default function ProductImage({ alt, src, srcSet, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) {
    return (
      <span className="img-fallback" role="img" aria-label={alt}>
        Photo unavailable
      </span>
    )
  }
  return <img alt={alt} src={src} srcSet={srcSet ?? srcSetFor(src)} decoding="async" onError={() => setFailed(true)} {...rest} />
}
