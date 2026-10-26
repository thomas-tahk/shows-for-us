import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Flagship } from '../src/data/show.ts'
import { offlineFetcher } from '../scripts/fetchers.ts'
import { formatDate, pullShows, stripHtml } from '../scripts/pull-lib.ts'

const flagships = JSON.parse(readFileSync('data/flagships.json', 'utf8')) as Flagship[]
const result = await pullShows(flagships, offlineFetcher('fixtures'))
const bySlug = (slug: string) => {
  const s = result.shows.find((x) => x.slug === slug)
  if (!s) throw new Error(`no show ${slug}`)
  return s
}

describe('flagships.json', () => {
  it('has 15 unique slugs, each with a reason', () => {
    expect(flagships).toHaveLength(15)
    expect(new Set(flagships.map((f) => f.slug)).size).toBe(15)
    for (const f of flagships) {
      expect(f.reason.length).toBeGreaterThan(10)
      expect(f.enwiki).toBeTruthy()
    }
  })
})

describe('offline pull', () => {
  it('builds shows with fixtures and reports the rest as skipped, not crashed', () => {
    expect(result.shows.map((s) => s.slug).sort()).toEqual(['hamilton', 'les-miserables'])
    expect(result.skipped).toHaveLength(13)
    expect(result.skipped.every((s) => s.reason.startsWith('skipped'))).toBe(true)
  })

  it('Hamilton', () => {
    const h = bySlug('hamilton')
    expect(h.qids).toEqual(['Q19320959'])
    expect(h.composers.map((p) => p.name)).toEqual(['Lin-Manuel Miranda'])
    expect(h.lyricists.map((p) => p.name)).toEqual(['Lin-Manuel Miranda'])
    expect(h.librettists.map((p) => p.name)).toEqual(['Lin-Manuel Miranda'])
    expect(h.composers[0].ibdb_url).toMatch(/^https:\/\/www\.ibdb\.com\//)
    expect(h.premiere).toEqual({ date: '2015-02-17', venue: 'The Public Theater' })
    expect(h.awards.map((a) => a.name)).toEqual(['Pulitzer Prize for Drama', 'Tony Award for Best Musical'])
    expect(h.image).toEqual({
      commons_file: 'Hamilton fixture placeholder.jpg',
      url: expect.stringMatching(/^https:\/\/upload\.wikimedia\.org\//),
      license: 'CC BY-SA 4.0',
      license_url: 'https://creativecommons.org/licenses/by-sa/4.0',
      author: 'Example Photographer (placeholder)',
      source_url: 'https://commons.wikimedia.org/wiki/File:Hamilton_fixture_placeholder.jpg',
    })
    expect(h.links.ibdb).toBe('https://www.ibdb.com/broadway-show/499520')
    expect(h.links.playbill).toBe('https://playbill.com/production/hamilton-richard-rodgers-theatre-vault-0000014104')
    expect(h.links.official_site).toBe('https://hamiltonmusical.com')
    expect(h.summary).toEqual({
      text: expect.stringContaining('Placeholder'),
      source_url: 'https://en.wikipedia.org/wiki/Hamilton_(musical)',
      license: 'CC BY-SA 4.0',
      modified: false,
    })
    expect(h.wikidata_url).toBe('https://www.wikidata.org/wiki/Q19320959')
  })

  it('Les Misérables merges two items, preferring English-version credits', () => {
    const l = bySlug('les-miserables')
    expect(l.qids).toEqual(['Q830581', 'Q111905785'])
    // English item has lyricists, so they replace the French ones
    expect(l.lyricists.map((p) => p.name)).toEqual(['Herbert Kretzmer', 'James Fenton'])
    // English item has none of these, so the original item fills in
    expect(l.composers.map((p) => p.name)).toEqual(['Claude-Michel Schönberg'])
    expect(l.librettists.map((p) => p.name)).toEqual(['Alain Boublil'])
    expect(l.premiere).toEqual({ date: '1985-09-28', venue: 'Barbican Centre' })
    expect(l.awards.map((a) => a.name)).toContain('Tony Award for Best Musical')
    expect(l.image?.license).toBe('CC BY 2.0')
    expect(l.image?.author).toBe('Example Author & Co (placeholder)')
    expect(l.image?.source_url).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
    expect(l.links.ibdb).toBe('https://www.ibdb.com/broadway-show/5340')
    expect(l.links.playbill).toMatch(/^https:\/\/playbill\.com\/production\//)
    expect(l.summary?.source_url).toBe('https://en.wikipedia.org/wiki/Les_Misérables_(musical)')
    expect(l.summary?.license).toBe('CC BY-SA 4.0')
    expect(l.wikidata_url).toBe('https://www.wikidata.org/wiki/Q111905785')
  })
})

describe('formatDate', () => {
  it('honours Wikidata time precision', () => {
    expect(formatDate('1980-01-01T00:00:00Z', '9')).toBe('1980')
    expect(formatDate('1980-09-01T00:00:00Z', 10)).toBe('1980-09')
    expect(formatDate('1980-09-17T00:00:00Z', '11')).toBe('1980-09-17')
    expect(formatDate('1980-09-17T00:00:00Z')).toBe('1980-09-17')
  })
})

describe('stripHtml', () => {
  it('removes tags and decodes entities', () => {
    expect(stripHtml('<a href="x">Tom &amp; Jerry&#039;s &quot;Show&quot;&nbsp;&lt;3&gt; &#x41;&#66;</a>')).toBe(
      'Tom & Jerry\'s "Show" <3> AB',
    )
  })
})
