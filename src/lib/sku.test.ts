import { describe, expect, it } from 'vitest'
import { nextSku } from './sku'

describe('nextSku', () => {
  it('continues the most-used pattern', () => {
    expect(nextSku(['KK-01', 'KK-02', 'KK-36'])).toBe('KK-37')
  })
  it('keeps zero padding', () => {
    expect(nextSku(['KS-007', 'KS-008'])).toBe('KS-009')
  })
  it('starts fresh with the fallback prefix', () => {
    expect(nextSku([])).toBe('KK-01')
    expect(nextSku([], 'KS')).toBe('KS-01')
  })
  it('ignores SKUs that do not match the pattern and never returns a taken one', () => {
    expect(nextSku(['VINTAGE', 'KK-1', 'KK-2'])).toBe('KK-03')
  })
})
