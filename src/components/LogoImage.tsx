import { useState } from 'react'
import { logoSources } from '../lib/images'

/** The shop logo at a fixed display size. The default logo is served as small WebP/PNG copies; an uploaded one as is. */
export default function LogoImage({ url, size, alt = '', className, lazy }: { url: string; size: number; alt?: string; className?: string; lazy?: boolean }) {
  const [original, setOriginal] = useState(false)
  const small = original ? undefined : logoSources(url, size)
  const img = (
    <img
      className={className}
      src={small?.src ?? url}
      srcSet={small?.pngSrcSet}
      alt={alt}
      width={size}
      height={size}
      loading={lazy ? 'lazy' : undefined}
      decoding="async"
      onError={() => setOriginal(true)}
    />
  )
  if (!small) return img
  return (
    <picture>
      <source type="image/webp" srcSet={small.webpSrcSet} />
      {img}
    </picture>
  )
}
