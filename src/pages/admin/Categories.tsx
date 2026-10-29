import { useState, type FormEvent } from 'react'
import { useProducts } from '../../context/ProductsContext'
import { useToast } from '../../context/ToastContext'
import type { CategoryItem } from '../../types'

export default function Categories() {
  const { categories, all, createCategory, updateCategory, removeCategory } = useProducts()
  const notify = useToast()
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState('')

  const run = async (fn: () => Promise<void>, done: string): Promise<boolean> => {
    setError('')
    try {
      await fn()
      notify(done)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      return false
    }
  }

  const count = (c: CategoryItem) => all.filter((p) => p.category === c.name).length

  async function add(e: FormEvent) {
    e.preventDefault()
    if (await run(() => createCategory(name), `Category “${name.trim()}” added.`)) setName('')
  }

  return (
    <div>
      <h2>Categories</h2>
      <p className="note">Categories group your stock in the shop filters and in the product form. Renaming a category updates every product in it.</p>
      <form className="inline category-add" onSubmit={add}>
        <label className="grow">
          <span className="label">New category</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Trousers" maxLength={40} />
        </label>
        <button type="submit" className="primary" disabled={name.trim().length < 2}>Add category</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Category</th><th>Products</th><th>Actions</th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="wrap">
                  {editing?.id === c.id ? (
                    <input aria-label={`New name for ${c.name}`} className="cell-input" value={editing.name} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} maxLength={40} autoFocus />
                  ) : c.name}
                </td>
                <td>{count(c)}</td>
                <td className="row-actions">
                  {editing?.id === c.id ? (
                    <>
                      <button type="button" onClick={async () => { if (await run(() => updateCategory(c.id, editing.name), 'Category renamed.')) setEditing(null) }}>Save</button>
                      <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setEditing({ id: c.id, name: c.name })}>Rename</button>
                      <button type="button" className="danger" disabled={count(c) > 0} title={count(c) > 0 ? 'Move its products to another category first' : undefined} onClick={() => { if (window.confirm(`Delete the category “${c.name}”?`)) void run(() => removeCategory(c.id), `Category “${c.name}” deleted.`) }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
