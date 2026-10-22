import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { storefrontProducts } from '../lib/inventory'
import { importSeed, isBackendConfigured, loadProducts, resetDemo, saveProduct } from '../lib/productRepo'
import type { Product } from '../types'

interface ProductsValue {
  /** Everything the current viewer may see (admins also see archived). */
  all: Product[]
  /** Storefront list: archived items removed. */
  live: Product[]
  loading: boolean
  error: string | null
  /** 'database' when Supabase is configured, otherwise 'demo' (bundled seed + browser-only edits). */
  source: 'database' | 'demo'
  refresh: () => Promise<void>
  save: (p: Product) => Promise<void>
  importSeedProducts: () => Promise<void>
  resetDemoData: () => void
}

const Ctx = createContext<ProductsValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setAll(await loadProducts())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
     
    void refresh()
  }, [refresh])

  const value = useMemo<ProductsValue>(
    () => ({
      all,
      live: storefrontProducts(all),
      loading,
      error,
      source: isBackendConfigured() ? 'database' : 'demo',
      refresh,
      save: async (p) => setAll(await saveProduct(p, all)),
      importSeedProducts: async () => setAll(await importSeed(all)),
      resetDemoData: () => setAll(resetDemo()),
    }),
    [all, loading, error, refresh],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useProducts(): ProductsValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useProducts must be used inside ProductsProvider')
  return v
}
