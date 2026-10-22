import { stockLabel } from '../lib/inventory'
import type { Product } from '../types'

const TBC = 'Details to confirm'

function measurementText(p: Product): string {
  const m = p.measurements
  if (!m) return TBC
  const parts = [
    m.chest ? `Chest ${m.chest} cm` : '',
    m.length ? `Length ${m.length} cm` : '',
    m.shoulder ? `Shoulder ${m.shoulder} cm` : '',
    m.sleeve ? `Sleeve ${m.sleeve} cm` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') + ' (laid flat)' : TBC
}

export default function ProductSpecs({ product: p }: { product: Product }) {
  const rows: [string, string, boolean][] = [
    ['SKU', p.sku, true],
    ['Category', p.category, true],
    ['Size', p.size ?? TBC, p.size !== null],
    ['Condition', p.condition ?? TBC, p.condition !== null],
    ['Measurements', measurementText(p), p.measurements !== null],
    ['Flaws', p.flaws === null ? TBC : p.flaws === '' ? 'None found on inspection' : p.flaws, p.flaws !== null],
    ['Availability', stockLabel(p), true],
  ]
  return (
    <dl className="specs">
      {rows.map(([k, v, known]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd className={known ? '' : 'tbc'}>{v}</dd>
        </div>
      ))}
    </dl>
  )
}
