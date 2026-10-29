import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { deleteInquiry, loadInquiries, setInquiryHandled } from '../../lib/shopRepo'
import type { Inquiry } from '../../types'

const CHANNEL: Record<Inquiry['channel'], string> = {
  'product-inquiry': 'Asked about an item',
  'order-request': 'Sent an order request',
}

/**
 * A log of WhatsApp button taps. It records which item was involved and when (no customer details), so the owner
 * knows which pieces attract interest. Customers' actual chats happen in WhatsApp; nothing here changes stock.
 */
export default function Inquiries() {
  const notify = useToast()
  const [list, setList] = useState<Inquiry[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setList(await loadInquiries())
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load inquiries.')
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const act = async (fn: () => Promise<void>, done?: string) => {
    try {
      await fn()
      if (done) notify(done)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
  }

  return (
    <div>
      <h2>Orders / Inquiries</h2>
      <p className="note">
        Each row is a customer tapping “Ask on WhatsApp” or “Send request on WhatsApp”. It is not a confirmed order: reply in WhatsApp, then mark the item sold in <Link to="/admin/inventory" className="text-link">Inventory</Link> once the sale is agreed.
      </p>
      {error && <p className="error" role="alert">{error}</p>}
      {list === null && !error && <p role="status">Loading…</p>}
      {list && list.length === 0 && <p className="note">No inquiries yet.</p>}
      {list && list.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>Item</th><th>SKU</th><th>What happened</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id}>
                  <td>{new Date(i.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="wrap">{i.productId ? <Link to={`/admin/products/${i.productId}`}>{i.productName}</Link> : i.productName}</td>
                  <td>{i.sku}</td>
                  <td>{CHANNEL[i.channel]}</td>
                  <td>{i.handled ? 'Handled' : 'New'}</td>
                  <td className="row-actions">
                    <button type="button" onClick={() => void act(() => setInquiryHandled(i.id, !i.handled))}>{i.handled ? 'Mark new' : 'Mark handled'}</button>
                    <button type="button" className="danger" onClick={() => void act(() => deleteInquiry(i.id), 'Inquiry removed.')}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
