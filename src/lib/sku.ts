/**
 * Suggests the next free SKU, continuing the pattern already in use (e.g. KK-36 -> KK-37).
 * The owner can always overwrite it; uniqueness is checked by the form and enforced by the database.
 */
export function nextSku(existing: string[], fallbackPrefix = 'KK'): string {
  const taken = new Set(existing.map((s) => s.toLowerCase()))
  const pattern = /^([A-Za-z]+)-(\d+)$/
  const counts = new Map<string, { n: number; max: number; width: number }>()
  for (const sku of existing) {
    const m = pattern.exec(sku)
    if (!m) continue
    const prefix = m[1].toUpperCase()
    const cur = counts.get(prefix) ?? { n: 0, max: 0, width: 2 }
    counts.set(prefix, { n: cur.n + 1, max: Math.max(cur.max, Number(m[2])), width: Math.max(cur.width, m[2].length) })
  }
  const [prefix, info] = [...counts.entries()].sort((a, b) => b[1].n - a[1].n)[0] ?? [fallbackPrefix, { n: 0, max: 0, width: 2 }]
  let n = info.max + 1
  let sku = `${prefix}-${String(n).padStart(info.width, '0')}`
  while (taken.has(sku.toLowerCase())) sku = `${prefix}-${String(++n).padStart(info.width, '0')}`
  return sku
}
