import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  firstSentences, knownFor, loadPersonSummary, parseSummary, parseWikidata, resetPersonSummaryCache, summaryUrl, wikidataUrl,
} from './personSummary'

// Fixtures follow the documented response shapes (wbgetentities, Wikipedia REST page summary).
const wikidata = {
  entities: { Q123: { sitelinks: { enwiki: { site: 'enwiki', title: 'Jerome Kern' } }, descriptions: { en: { language: 'en', value: 'American composer' } } } },
}
const summary = {
  type: 'standard',
  title: 'Jerome Kern',
  description: 'American composer (1885–1945)',
  extract: 'Jerome David Kern was an American composer of musical theatre. He wrote Show Boat. A third sentence.',
  thumbnail: { source: 'https://upload.wikimedia.org/kern.jpg', width: 320, height: 400 },
  content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Jerome_Kern' } },
}

afterEach(() => {
  vi.unstubAllGlobals()
  resetPersonSummaryCache()
})

function stubFetch(handler: (url: string) => unknown) {
  const fn = vi.fn(async (url: string) => {
    const body = handler(url)
    if (body === null) return { ok: false, status: 500, json: async () => ({}) }
    return { ok: true, status: 200, json: async () => body }
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('person summary parsing', () => {
  it('builds the documented URLs', () => {
    expect(wikidataUrl('Q123')).toBe(
      'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q123&props=sitelinks|descriptions&sitefilter=enwiki&languages=en&format=json&origin=*',
    )
    expect(summaryUrl('Jerome Kern (composer)')).toBe('https://en.wikipedia.org/api/rest_v1/page/summary/Jerome_Kern_(composer)')
  })

  it('reads enwiki title and description', () => {
    expect(parseWikidata(wikidata, 'Q123')).toEqual({ enwiki: 'Jerome Kern', description: 'American composer' })
    expect(parseWikidata({ entities: { Q9: {} } }, 'Q9')).toEqual({ enwiki: null, description: null })
    expect(parseWikidata({}, 'Q9')).toEqual({ enwiki: null, description: null })
  })

  it('maps a summary and trims to two sentences', () => {
    const s = parseSummary(summary, null)
    expect(s?.extract).toBe('Jerome David Kern was an American composer of musical theatre. He wrote Show Boat.')
    expect(s?.thumbnailUrl).toBe('https://upload.wikimedia.org/kern.jpg')
    expect(s?.pageUrl).toBe('https://en.wikipedia.org/wiki/Jerome_Kern')
  })

  it('rejects disambiguation pages and keeps initials together', () => {
    expect(parseSummary({ ...summary, type: 'disambiguation' }, null)).toBeNull()
    expect(firstSentences('J. K. Rowling wrote books. She is rich. More.')).toBe('J. K. Rowling wrote books. She is rich.')
  })

  it('does not split on abbreviations, closing quotes or decimals', () => {
    expect(firstSentences('He shaped the U.S. stage. Then he left. Later.')).toBe('He shaped the U.S. stage. Then he left.')
    expect(firstSentences('He wrote "Ol\' Man River." Then he left. Later.')).toBe('He wrote "Ol\' Man River." Then he left.')
    expect(firstSentences('It earned $1.5 million. Then it closed. Later.')).toBe('It earned $1.5 million. Then it closed.')
  })
})

describe('loadPersonSummary', () => {
  it('fetches wikidata then wikipedia once per qid', async () => {
    const fetchMock = stubFetch(url => (url.includes('wikidata') ? wikidata : summary))
    const a = await loadPersonSummary('Q123')
    await loadPersonSummary('Q123')
    expect(a?.title).toBe('Jerome Kern')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('resolves null when there is no enwiki article', async () => {
    stubFetch(() => ({ entities: { Q5: {} } }))
    expect(await loadPersonSummary('Q5')).toBeNull()
  })

  it('resolves null (never rejects) on HTTP and network failure, and retries next time', async () => {
    stubFetch(() => null)
    expect(await loadPersonSummary('Q123')).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    expect(await loadPersonSummary('Q2')).toBeNull()
    const ok = stubFetch(url => (url.includes('wikidata') ? wikidata : summary))
    expect((await loadPersonSummary('Q123'))?.title).toBe('Jerome Kern')
    expect(ok).toHaveBeenCalledTimes(2)
  })

  it('caches "no enwiki article"', async () => {
    const f = stubFetch(() => ({ entities: { Q5: {} } }))
    await loadPersonSummary('Q5')
    await loadPersonSummary('Q5')
    expect(f).toHaveBeenCalledTimes(1)
  })
})

describe('knownFor', () => {
  const e = (slug: string, year: string | null, creators: string[]) => ({ slug, title: slug.toUpperCase(), year, creators })
  it('picks the 3 earliest shows by this creator, unknown years last', () => {
    const entries = [e('d', '1990', ['Kern']), e('a', '1927', ['Kern', 'Hammerstein']), e('x', '1900', ['Other']), e('n', null, ['Kern']), e('b', '1935', ['Kern'])]
    expect(knownFor(entries, 'Kern').map(s => s.slug)).toEqual(['a', 'b', 'd'])
    expect(knownFor(entries, 'Nobody')).toEqual([])
  })
})
