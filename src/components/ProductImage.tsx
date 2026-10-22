import { useState, type ImgHTMLAttributes } from 'react'

/** <img> with a neutral placeholder if the photo fails to load. */
export default function ProductImage({ alt, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span className="img-fallback" role="img" aria-label={alt}>
        Photo unavailable
      </span>
    )
  }
  return <img alt={alt} onError={() => setFailed(true)} {...rest} />
}
