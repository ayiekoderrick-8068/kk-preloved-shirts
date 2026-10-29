import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { storefrontProducts } from '../lib/inventory'
import { deleteProduct, importSeed, isBackendConfigured, loadProducts, resetDemo, saveProduct } from '../lib/productRepo'
import { addCategory, deleteCategory, loadCategories, renameCategory } from '../lib/shopRepo'
import type { CategoryItem, Product } from '../types'

interface ProductsValue {
  /** Everything the current viewer may see (admins also see drafts and archived). */
  all: Product[]
  /** Storefront list: drafts and archived items removed. */
  live: Product[]
  categories: CategoryItem[]
  loading: boolean
  error: string | null
  /** 'database' when Supabase is configured, otherwise 'demo' (bundled seed + browser-only edits). */
  source: 'database' | 'demo'
  refresh: () => Promise<void>
  save: (p: Product) => Promise<void>
  remove: (id: string) => Promise<void>
  importSeedProducts: () => Promise<void>
  resetDemoData: () => void
  createCategory: (name: string) => Promise<void>
  updateCategory: (id: string, name: string) => Promise<void>
  removeCategory: (id: string) => Promise<void>
}

const Ctx = createContext<ProductsValue | null>(null)

/** Category names used by products, for when the categories table is not available yet. */
const categoriesFromProducts = (products: Product[]): CategoryItem[] =>
  [...new Set(products.map((p) => p.category))].map((name, i) => ({ id: `derived-${name}`, name, sortOrder: i + 1 }))

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const products = await loadProducts()
      setAll(products)
      try {
        setCategories(await loadCategories())
      } catch {
        setCategories(categoriesFromProducts(products))
      }
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

  const value = useMemo<ProductsValue>(() => {
    const source = isBackendConfigured() ? 'database' : 'demo'
    return {
      all,
      live: storefrontProducts(all),
      categories,
      loading,
      error,
      source,
      refresh,
      save: async (p) => setAll(await saveProduct(p, all)),
      remove: async (id) => setAll(await deleteProduct(id, all)),
      importSeedProducts: async () => setAll(await importSeed(all)),
      resetDemoData: () => setAll(resetDemo()),
      createCategory: async (name) => setCategories(await addCategory(name, categories)),
      updateCategory: async (id, name) => {
        const old = categories.find((c) => c.id === id)
        setCategories(await renameCategory(id, name, categories))
        // The database cascades a rename to products; the browser-only demo copy needs it done by hand.
        if (old && source === 'demo') {
          let list = all
          for (const p of all.filter((x) => x.category === old.name)) list = await saveProduct({ ...p, category: name.trim() }, list)
          setAll(list)
        } else await refresh()
      },
      removeCategory: async (id) => setCategories(await deleteCategory(id, categories, all)),
    }
  }, [all, categories, loading, error, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useProducts(): ProductsValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useProducts must be used inside ProductsProvider')
  return v
}
