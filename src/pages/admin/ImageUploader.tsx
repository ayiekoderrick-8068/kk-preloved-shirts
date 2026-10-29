import { useRef, useState, type DragEvent } from 'react'
import { checkImageFile, originalPathFor, variantUrl } from '../../lib/images'
import { originalDownloadUrl, uploadImage } from '../../lib/productRepo'
import { hasSupabase } from '../../lib/config'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
  error?: string
  /** Storage folder inside the bucket. */
  folder?: string
}

/**
 * Multi-photo uploader: pick or drag in several photos, they are compressed in the browser and uploaded to storage.
 * The first photo is the main one (shown on cards); photos can be reordered by dragging or with the arrow buttons.
 */
export default function ImageUploader({ images, onChange, error, folder }: Props) {
  const latest = useRef(images)
  latest.current = images
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState('')
  const [problems, setProblems] = useState<string[]>([])
  const [over, setOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [url, setUrl] = useState('')
  const [keepOriginal, setKeepOriginal] = useState(true)

  async function downloadOriginal(photoUrl: string) {
    try {
      window.open(await originalDownloadUrl(photoUrl), '_blank', 'noopener')
      setProblems([])
    } catch (e) {
      setProblems([e instanceof Error ? e.message : 'Could not get the original.'])
    }
  }

  const update = (next: string[]) => {
    latest.current = next
    onChange(next)
  }

  async function addFiles(files: File[]) {
    const found: string[] = []
    const ok = files.filter((f) => {
      const p = checkImageFile(f)
      if (p) found.push(p)
      return !p
    })
    // Sequential uploads keep the photo order the owner picked and avoid hammering a slow mobile connection.
    for (const [i, f] of ok.entries()) {
      setBusy(`Uploading photo ${i + 1} of ${ok.length}…`)
      try {
        update([...latest.current, await uploadImage(f, folder, { keepOriginal: hasSupabase && keepOriginal, onWarning: (m) => found.push(m) })])
      } catch (e) {
        found.push(e instanceof Error ? e.message : `Could not upload "${f.name}".`)
      }
    }
    setBusy('')
    setProblems(found)
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    update(next)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    if (e.dataTransfer.files.length > 0) void addFiles([...e.dataTransfer.files])
  }

  return (
    <fieldset className="uploader">
      <legend>Photos (real photos of this exact item only)</legend>
      <div
        className={`dropzone${over ? ' is-over' : ''}`}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            setOver(true)
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <p>Drag photos here, or</p>
        <button type="button" className="secondary" onClick={() => fileInput.current?.click()} disabled={busy !== ''}>
          Choose photos
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          aria-label="Upload photos"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])]
            e.target.value = ''
            if (files.length) void addFiles(files)
          }}
        />
        <p className="note">
          JPEG, PNG or WebP. Photos are resized automatically so they load quickly on phones without losing detail.
          {!hasSupabase && ' Demo mode keeps small copies in this browser only.'}
        </p>
        {hasSupabase && (
          <label className="check">
            <input type="checkbox" checked={keepOriginal} onChange={(e) => setKeepOriginal(e.target.checked)} /> Also keep the original full-resolution photo (private: only signed-in admins can download it)
          </label>
        )}
      </div>

      {busy && <p role="status" className="note">{busy}</p>}
      {problems.length > 0 && (
        <ul className="error-list" role="alert">
          {problems.map((p) => <li key={p} className="error">{p}</li>)}
        </ul>
      )}

      {images.length > 0 && (
        <ol className="photo-grid" aria-label="Product photos in display order">
          {images.map((src, i) => (
            <li
              key={src}
              className={`photo${i === 0 ? ' is-main' : ''}${dragIndex === i ? ' is-dragging' : ''}`}
              draggable
              onDragStart={(e) => {
                setDragIndex(i)
                e.dataTransfer.setData('text/x-photo-index', String(i))
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                if (dragIndex !== null) e.preventDefault()
              }}
              onDrop={(e) => {
                if (dragIndex === null) return
                e.preventDefault()
                e.stopPropagation()
                move(dragIndex, i)
                setDragIndex(null)
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              <img src={variantUrl(src, 480)} alt={`Photo ${i + 1}${i === 0 ? ' (main)' : ''}`} />
              {i === 0 && <span className="main-badge">Main</span>}
              <div className="photo-actions">
                {i !== 0 && <button type="button" onClick={() => move(i, 0)} aria-label={`Make photo ${i + 1} the main photo`}>Make main</button>}
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>←</button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label={`Move photo ${i + 1} later`}>→</button>
                {hasSupabase && originalPathFor(src) && <button type="button" onClick={() => void downloadOriginal(src)} aria-label={`Download the original of photo ${i + 1}`}>Original</button>}
                <button type="button" onClick={() => update(images.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`}>Remove</button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <details className="url-add">
        <summary>Add a photo from a web link instead</summary>
        <div className="inline">
          <input aria-label="Image URL" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button
            type="button"
            className="secondary"
            onClick={() => {
              if (!/^https:\/\//.test(url.trim())) return setProblems(['Image links must start with https://'])
              update([...images, url.trim()])
              setUrl('')
              setProblems([])
            }}
          >
            Add link
          </button>
        </div>
      </details>
      {error && <p className="error" role="alert">{error}</p>}
    </fieldset>
  )
}
