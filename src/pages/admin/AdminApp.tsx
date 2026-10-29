import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Seo from '../../components/Seo'
import { useProducts } from '../../context/ProductsContext'
import { supabase } from '../../lib/supabase'
import Categories from './Categories'
import Inquiries from './Inquiries'
import Inventory from './Inventory'
import Overview from './Overview'
import ProductEditor from './ProductEditor'
import ProductsList from './ProductsList'
import SettingsPage from './SettingsPage'

type Auth = 'checking' | 'signed-out' | 'not-admin' | 'admin'

const NAV: [string, string][] = [
  ['/admin', 'Overview'],
  ['/admin/products', 'Products'],
  ['/admin/products/new', 'Add New Stock'],
  ['/admin/inventory', 'Inventory'],
  ['/admin/categories', 'Categories'],
  ['/admin/inquiries', 'Orders / Inquiries'],
  ['/admin/settings', 'Shop Settings'],
]

/**
 * Everything under /admin. The sign-in gate here is a convenience; the real protection is in the database:
 * Row Level Security only lets a signed-in user listed in `admins` change products, categories, settings or photos.
 */
export default function AdminApp() {
  const { source, refresh } = useProducts()
  const [auth, setAuth] = useState<Auth>(source === 'demo' ? 'admin' : 'checking')

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    async function check() {
      const { data } = await client.auth.getUser()
      if (!data.user) return setAuth('signed-out')
      const { data: row } = await client.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
      setAuth(row ? 'admin' : 'not-admin')
      if (row) void refresh()
    }
    void check()
    const { data: sub } = client.auth.onAuthStateChange(() => void check())
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  return (
    <section className="section page admin">
      <Seo title="Admin" description="Shop management" path="/admin" noindex />
      <p className="eyebrow">Admin</p>
      <h1>Shop management</h1>

      {source === 'demo' && (
        <p className="banner" role="note">
          <strong>Demo mode - no database connected.</strong> Everything you change is saved only in this browser and is NOT visible to customers. Connect Supabase (see docs/ADMIN.md) for real, shared, secured stock.
        </p>
      )}

      {auth === 'checking' && <p role="status">Checking sign-in…</p>}
      {auth === 'signed-out' && <SignIn />}
      {auth === 'not-admin' && (
        <p className="banner" role="alert">
          You are signed in but this account is not an admin. Ask the owner to add you to the admins table.{' '}
          <button type="button" className="text-link" onClick={() => supabase?.auth.signOut()}>Sign out</button>
        </p>
      )}

      {auth === 'admin' && (
        <>
          <nav className="admin-nav" aria-label="Admin">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end>
                {label}
              </NavLink>
            ))}
            <span className="admin-nav-end">
              <Link to="/" className="text-link">View shop</Link>
              {source === 'database' && <button type="button" className="text-link" onClick={() => supabase?.auth.signOut()}>Sign out</button>}
            </span>
          </nav>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="products/new" element={<ProductEditor />} />
            <Route path="products/:id" element={<ProductEditor />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="categories" element={<Categories />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<p>That admin page does not exist. <Link to="/admin" className="text-link">Back to overview</Link></p>} />
          </Routes>
        </>
      )}
    </section>
  )
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const { error: err } = await supabase!.auth.signInWithPassword({ email, password })
    setError(err ? 'Sign-in failed. Check your email and password.' : '')
  }

  return (
    <form onSubmit={submit} className="admin-form narrow" aria-label="Admin sign in">
      <label className="field">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
      <label className="field">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" type="submit">Sign in</button>
    </form>
  )
}
