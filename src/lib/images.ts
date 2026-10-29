/**
 * Product photo pipeline. The owner uploads a camera photo; the browser resizes it (keeping its aspect ratio and
 * colours, no cropping or stretching) into three WebP sizes that are uploaded to storage. The product stores the
 * largest URL and the storefront derives the smaller ones for `srcset`, so phones download ~480px images
 * instead of full camera originals.
 */
export const IMAGE_WIDTHS = [480, 960, 1600] as const
export const MAX_INPUT_BYTES = 25 * 1024 * 1024
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const LARGEST = IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]
const VARIANT_RE = new RegExp(`-${LARGEST}\\.(webp|jpg)$`)

/** URL of a given width for an uploaded photo, or the URL itself if it is not one of ours (seed photos, external links). */
export function variantUrl(url: string, width: number): string {
  return VARIANT_RE.test(url) ? url.replace(VARIANT_RE, (_m, ext: string) => `-${width}.${ext}`) : url
}

/** `srcset` for a stored photo URL, or undefined when no resized variants exist for it. */
export function srcSetFor(url: string): string | undefined {
  if (!VARIANT_RE.test(url)) return undefined
  return IMAGE_WIDTHS.map((w) => `${variantUrl(url, w)} ${w}w`).join(', ')
}

const ORIGINAL_RE = /\/product-images\/(.+)-1600\.(?:webp|jpg)$/

/**
 * Path of the private original for an uploaded photo (bucket `product-originals`), or undefined when the photo is not
 * one of ours (built-in shop photos, external links). The original shares the photo's id: <id>-1600.webp <-> <id>-original.
 */
export function originalPathFor(url: string): string | undefined {
  const m = ORIGINAL_RE.exec(url)
  return m ? `${m[1]}-original` : undefined
}

const STATIC_RE =/^(\/assets\/products\/p-\d+)\.webp$/
/** Static photos are 800-1100px wide (full size ~880w); `scripts/optimize-images.mjs` derives the other files. */
const STATIC_FULL_WIDTH = 880
const STATIC_SMALL_WIDTH = 480

/**
 * Responsive sources for the built-in shop photos: an AVIF and a WebP `srcset`, each with a phone-sized (480w)
 * and the full-size file. Returns undefined for uploaded or external photos, which use `srcSetFor` instead.
 */
export function staticSources(url: string): { avif: string; webp: string } | undefined {
  const m = STATIC_RE.exec(url)
  if (!m) return undefined
  const base = m[1]
  return {
    avif: `${base}-${STATIC_SMALL_WIDTH}.avif ${STATIC_SMALL_WIDTH}w, ${base}.avif ${STATIC_FULL_WIDTH}w`,
    webp: `${base}-${STATIC_SMALL_WIDTH}.webp ${STATIC_SMALL_WIDTH}w, ${base}.webp ${STATIC_FULL_WIDTH}w`,
  }
}

/** The default logo has pre-made small copies; a logo uploaded by the owner is used as is. */
export function logoSources(url: string, size: number): { src: string; webpSrcSet: string; pngSrcSet: string } | undefined {
  if (url !== '/logo.png') return undefined
  const one = size <= 56 ? 112 : 224
  const two = 224
  return {
    src: `/logo-${one}.png`,
    webpSrcSet: `/logo-${one}.webp 1x, /logo-${two}.webp 2x`,
    pngSrcSet: `/logo-${one}.png 1x, /logo-${two}.png 2x`,
  }
}

export interface Variant {
  width: number
  blob: Blob
  ext: 'webp' | 'jpg'
}

/** Pixel size after scaling the longest edge down to `maxEdge` (never upscaled). */
export function fitWithin(w: number, h: number, maxEdge: number): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/** Resizes one image to a single width. EXIF rotation is applied so portrait phone photos stay upright. */
export async function resizeImage(file: File, maxEdge: number, quality = 0.84): Promise<Variant> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error(`Could not read "${file.name}". Use a JPEG, PNG or WebP photo (iPhone HEIC photos must be saved as JPEG first).`)
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Your browser cannot process images.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const webp = await toBlob(canvas, 'image/webp', quality)
  if (webp && webp.type === 'image/webp') return { width, blob: webp, ext: 'webp' }
  const jpg = await toBlob(canvas, 'image/jpeg', quality)
  if (!jpg) throw new Error(`Could not compress "${file.name}".`)
  return { width, blob: jpg, ext: 'jpg' }
}

export function checkImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `"${file.name}" is not a JPEG, PNG or WebP photo.`
  if (file.size > MAX_INPUT_BYTES) return `"${file.name}" is larger than 25 MB.`
  return null
}

export const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Could not read the image.'))
    r.readAsDataURL(blob)
  })
