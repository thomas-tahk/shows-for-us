import { describe, expect, it } from 'vitest'
import { filterIndex, searchIndex } from './catalog'

describe('filterIndex', () => {
  it('returns all 15 flagships for an empty query', () => {
    expect(filterIndex(searchIndex, '  ')).toHaveLength(15)
  })
  it('matches titles by substring, case-insensitively', () => {
    expect(filterIndex(searchIndex, 'HAMIL').map(e => e.slug)).toContain('hamilton')
  })
  it('ignores accents in both directions', () => {
    expect(filterIndex(searchIndex, 'miserables').map(e => e.slug)).toContain('les-miserables')
    expect(filterIndex(searchIndex, 'Misérables').map(e => e.slug)).toContain('les-miserables')
  })
  it('matches creator names', () => {
    expect(filterIndex(searchIndex, 'lin-manuel').map(e => e.slug)).toContain('hamilton')
  })
  it('treats punctuation as a space', () => {
    expect(filterIndex(searchIndex, 'lin manuel').map(e => e.slug)).toContain('hamilton')
  })
  it('returns nothing for a nonsense query', () => {
    expect(filterIndex(searchIndex, 'zzzzqq')).toEqual([])
  })
})
