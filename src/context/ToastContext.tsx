import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export interface ToastAction {
  label: string
  onClick: () => void
}

type Notify = (msg: string, action?: ToastAction) => void

const Ctx = createContext<Notify>(() => {})

/**
 * Corner toast. It is rendered at the app root (a sibling of the dialogs, never inside one) and uses the
 * highest z-index token, so it always sits above the modal backdrop, dialogs and drawer.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; action?: ToastAction } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast(null)
  }, [])

  const notify = useCallback<Notify>((msg, action) => {
    window.clearTimeout(timer.current)
    setToast({ msg, action })
    // Toasts with an action stay a little longer so there is time to use it.
    timer.current = window.setTimeout(() => setToast(null), action ? 6000 : 3500)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <Ctx.Provider value={notify}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.msg}>
            <span className="toast-msg">{toast.msg}</span>
            {toast.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  toast.action?.onClick()
                  dismiss()
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" className="toast-close" onClick={dismiss} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
