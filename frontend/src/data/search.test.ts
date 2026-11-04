import { describe, expect, it } from 'vitest'
import { search, type SearchableEntry } from './search'
import { realisticEntries } from './search.fixture'

const e = (
  title: string,
  creators: string[] = [],
  opts: { year?: string | null; flagship?: boolean } = {},
): SearchableEntry => ({
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  title,
  year: opts.year ?? null,
  creators,
  flagship: opts.flagship ?? false,
})
const titles = (entries: SearchableEntry[], q: string, limit = 50) =>
  search(entries, q, limit).results.map(r => r.title)

describe('joined words', () => {
  it('does not join words separated by spaces', () =>
    expect(titles([e('The Melody Lingers')], 'theme')).toEqual([]))
  it('joins hyphenated words', () =>
    expect(titles([e('Spider-Man: Turn Off the Dark')], 'spiderman')).toHaveLength(1))
})

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
    const l = [e('Show Boat', [], { year: '1927' }), e('Chicago', [], { year: '1975' })]
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
      e('Zeta Cats', [], { flagship: true }),
      e('Cats Flagship', [], { flagship: true }),
    ]
    expect(titles(l, 'cats')).toEqual(['Cats Flagship', 'Cats', 'Cats Again', 'Zeta Cats', 'Alpha Cats', 'Zed Cats', 'Other'])
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
    const l = [e('A'), e('B', [], { flagship: true }), e('C', [], { flagship: true })]
    const r = search(l, '  ', 50)
    expect(r.results.map(x => x.title)).toEqual(['B', 'C'])
    expect(r.total).toBe(2)
  })
})

describe('performance', () => {
  it('searches 6,000 entries in under 200 ms (guards against O(n^2))', () => {
    const words = ['night', 'river', 'golden', 'city', 'dream', 'story', 'house', 'star', 'moon', 'garden']
    const l = Array.from({ length: 6000 }, (_, i) =>
      e(`${words[i % 10]} ${words[(i * 7) % 10]} ${i}`, [`Person ${words[(i * 3) % 10]}`, 'Another Writer'], { year: String(1900 + (i % 120)) }),
    )
    search(l, 'warm up', 50)
    const t0 = performance.now()
    search(l, 'gardn mon', 50)
    expect(performance.now() - t0).toBeLessThan(200)
  })
})

describe('exact beats typo; flagship boost only within a tier', () => {
  it('ranks exact creator above typo title', () => {
    expect(titles([e('Robert Show'), e('Zed', ['Robber Baron'])], 'robber')).toEqual(['Zed', 'Robert Show'])
  })
  it('does not let a flagship typo outrank an exact non-flagship', () => {
    const l = [e('Hart Show', [], { flagship: true }), e('Heart Show')]
    expect(titles(l, 'heart')).toEqual(['Heart Show', 'Hart Show'])
  })
  it('allows no typo on the first letter', () => {
    expect(titles([e('Family')], 'hamil')).toEqual([])
    expect(titles([e('Eight')], 'night')).toEqual([])
  })
})

describe('punctuation and compounds', () => {
  it('drops apostrophes', () => {
    expect(titles([e('Ain\u2019t Misbehavin\u2019'), e("Smokey Joe's Cafe")], 'aint misbehavin')).toEqual(['Ain\u2019t Misbehavin\u2019'])
    expect(titles([e("Smokey Joe's Cafe")], 'smokey joes')).toHaveLength(1)
  })
  it('joins adjacent tokens', () => {
    expect(titles([e('Spider-Man: Turn Off the Dark')], 'spiderman')).toHaveLength(1)
  })
})

describe('realistic catalogue', () => {
  const top = (q: string, n = 3) => titles(realisticEntries, q).slice(0, n)
  it('night: Night titles first', () => {
    for (const t of top('night', 4)) expect(t.toLowerCase()).toContain('night')
  })
  it('hamil: Hamilton first, no Family titles', () => {
    expect(top('hamil')[0]).toBe('Hamilton')
    expect(titles(realisticEntries, 'hamil').join('|')).not.toContain('Family')
  })
  it('robber: The Robber Bridegroom first', () => expect(top('robber')[0]).toBe('The Robber Bridegroom'))
  it('heart: a Heart title first', () => expect(top('heart')[0]).toMatch(/heart/i))
  it('mister: a Mister title first', () => expect(top('mister')[0]).toMatch(/^Mister/))
  it('finds apostrophe and hyphen shows', () => {
    expect(top('smokey joes')[0]).toBe('Smokey Joe\u2019s Cafe')
    expect(top('aint misbehavin')[0]).toBe('Ain\u2019t Misbehavin\u2019')
    expect(top('spiderman')[0]).toBe('Spider-Man: Turn Off the Dark')
  })
})
