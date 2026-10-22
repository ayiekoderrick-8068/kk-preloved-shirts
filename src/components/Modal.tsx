import { useEffect, useRef, type ReactNode } from 'react'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

interface Props {
  open: boolean
  onClose: () => void
  label: string
  variant: 'drawer' | 'modal'
  children: ReactNode
}

/** Accessible dialog: focus trap, Escape to close, scroll lock, focus restored to the opener. */
export default function Modal({ open, onClose, label, variant, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const el = ref.current
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !el) return
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null)
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      opener?.focus?.()
    }
  }, [open])

  return (
    <>
      <div className={`shade${open ? ' active' : ''}`} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={`${variant}${open ? ' active' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-hidden={!open}
        // Closed dialogs must be removed from the tab order and accessibility tree.
        {...(open ? {} : { inert: true })}
      >
        {open && children}
      </div>
    </>
  )
}
