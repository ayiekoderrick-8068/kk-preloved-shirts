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
