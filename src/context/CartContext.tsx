import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CART_STORAGE_KEY, addLine, cartCount, parseStoredCart, reconcileCart, removeLine, setLineQty } from '../lib/cart'
import { cartTotals } from '../lib/pricing'
import type { CartLine, Product } from '../types'
import { useProducts } from './ProductsContext'
import { useToast } from './ToastContext'

interface CartValue {
  lines: CartLine[]
  count: number
  subtotal: number
  /** KES saved by the pair deal. */
  savings: number
  /** Standard-priced shirts in the bag (those eligible for the pair deal). */
  standardCount: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  add: (p: Product) => boolean
  setQty: (p: Product, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
  inBag: (productId: string) => boolean
}

const Ctx = createContext<CartValue | null>(null)

function readStored(): CartLine[] {
  try {
    return parseStoredCart(localStorage.getItem(CART_STORAGE_KEY))
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { all, loading } = useProducts()
  const notify = useToast()
  const [lines, setLines] = useState<CartLine[]>(readStored)
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* storage unavailable - cart lives for this session only */
    }
  }, [lines])

  // Once real inventory has loaded, drop sold/removed items and clamp quantities.
  useEffect(() => {
    if (loading || all.length === 0) return
    const r = reconcileCart(lines, all)
    if (r.removed.length === 0 && r.adjusted.length === 0) return
     
    setLines(r.lines)
    if (r.removed.length) notify(`No longer available and removed from your bag: ${r.removed.join(', ')}.`)
    else notify(`Quantity updated to match stock: ${r.adjusted.join(', ')}.`)
  }, [all, loading, lines, notify])

  const add = useCallback(
    (p: Product) => {
      const r = addLine(lines, p)
      if (r.error) {
        notify(r.error)
        return false
      }
      setLines(r.lines)
      return true
    },
    [lines, notify],
  )

  const setQty = useCallback(
    (p: Product, qty: number) => {
      const r = setLineQty(lines, p, qty)
      if (r.error) notify(r.error)
      setLines(r.lines)
    },
    [lines, notify],
  )

  const value = useMemo<CartValue>(
    () => ({
      lines,
      count: cartCount(lines),
      ...(({ subtotal, savings, standardCount }) => ({ subtotal, savings, standardCount }))(cartTotals(lines, all)),
      isOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      add,
      setQty,
      remove: (id) => setLines((l) => removeLine(l, id)),
      clear: () => setLines([]),
      inBag: (id) => lines.some((l) => l.productId === id),
    }),
    [lines, all, isOpen, add, setQty],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart(): CartValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCart must be used inside CartProvider')
  return v
}
