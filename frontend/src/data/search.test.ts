import { describe, expect, it } from 'vitest'
import { search, type SearchableEntry } from './search'

const e = (title: string, creators: string[] = [], year: string | null = null, flagship = false): SearchableEntry => ({
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  title,
  year,
  creators,
  flagship,
})
const titles = (entries: SearchableEntry[], q: string, limit = 50) =>
  search(entries, q, limit).results.map(r => r.title)

describe('typo tolerance', () => {
  const list = [e('Hamilton', ['Lin-Manuel Miranda']), e('Sweeney Todd', ['Stephen Sondheim'])]
  it('finds a missing letter', () => expect(titles(list, 'hamiltn')).toEqual(['Hamilton']))
  it('finds an extra letter', () => expect(titles(list, 'hamiltton')).toEqual(['Hamilton']))
  it('finds a substituted letter', () => expect(titles(list, 'hamolton')).toEqual(['Hamilton']))
  it('finds a transposition in a creator', () => expect(titles(list, 'sondhiem')).toEqual(['Sweeney Todd']))
  it('does not allow two edits in one word', () => expect(titles(list, 'hmiltno')).toEqual([]))
  it('allows no typos in words under 5 letters', () => {
    const l = [e('Cats'), e('Gypsy')]
    expect(titles(l, 'cast')).toEqual([])
    expect(titles(l, 'gypy')).toEqual([])
    expect(titles(l, 'gypsy')).toEqual(['Gypsy'])
    expect(titles(l, 'gypsi')).toEqual(['Gypsy'])
  })
})

describe('matching', () => {
  it('ignores case, accents and punctuation', () => {
    const l = [e('Les Misérables', ['Claude-Michel Schönberg'])]
    expect(titles(l, 'LES MISERABLES')).toHaveLength(1)
    expect(titles(l, 'les, miserables!')).toHaveLength(1)
    expect(titles(l, 'schonberg')).toHaveLength(1)
    expect(titles(l, 'claude michel')).toHaveLength(1)
  })
  it('matches word prefixes across words', () => {
    expect(titles([e('The Robber Bridegroom')], 'robber brid')).toHaveLength(1)
  })
  it('matches year', () => {
    const l = [e('Show Boat', [], '1927'), e('Chicago', [], '1975')]
    expect(titles(l, '1927')).toEqual(['Show Boat'])
  })
  it('requires every query word to match', () => {
    expect(titles([e('Show Boat', ['Jerome Kern'])], 'show kern')).toHaveLength(1)
    expect(titles([e('Show Boat', ['Jerome Kern'])], 'show zzzz')).toHaveLength(0)
  })
})

describe('ranking', () => {
  it('orders flagships, title prefix, other title, creator/year, alphabetical inside', () => {
    const l = [
      e('Zed Cats', ['Someone']),
      e('Cats Again'),
      e('Alpha Cats'),
      e('Cats'),
      e('Other', ['Cats Person']),
      e('Zeta Cats', [], null, true),
      e('Cats Flagship', [], null, true),
    ]
    expect(titles(l, 'cats')).toEqual(['Cats Flagship', 'Zeta Cats', 'Cats', 'Cats Again', 'Alpha Cats', 'Zed Cats', 'Other'])
  })
  it('puts a typo title-prefix match in the prefix tier', () => {
    expect(titles([e('Zzz Hamilton'), e('Hamilton')], 'hamiltn')).toEqual(['Hamilton', 'Zzz Hamilton'])
  })
})

describe('cap and count', () => {
  it('returns the true total with at most limit results', () => {
    const l = Array.from({ length: 123 }, (_, i) => e(`Show ${String(i).padStart(3, '0')}`))
    const r = search(l, 'show', 50)
    expect(r.total).toBe(123)
    expect(r.results).toHaveLength(50)
    expect(r.results[0].title).toBe('Show 000')
  })
  it('empty query returns only flagships', () => {
    const l = [e('A'), e('B', [], null, true), e('C', [], null, true)]
    const r = search(l, '  ', 50)
    expect(r.results.map(x => x.title)).toEqual(['B', 'C'])
    expect(r.total).toBe(2)
  })
})

describe('performance', () => {
  it('searches 6,000 entries in under 50 ms', () => {
    const words = ['night', 'river', 'golden', 'city', 'dream', 'story', 'house', 'star', 'moon', 'garden']
    const l = Array.from({ length: 6000 }, (_, i) =>
      e(`${words[i % 10]} ${words[(i * 7) % 10]} ${i}`, [`Person ${words[(i * 3) % 10]}`, 'Another Writer'], String(1900 + (i % 120))),
    )
    search(l, 'warm up', 50)
    const t0 = performance.now()
    search(l, 'gardn mon', 50)
    expect(performance.now() - t0).toBeLessThan(50)
  })
})
