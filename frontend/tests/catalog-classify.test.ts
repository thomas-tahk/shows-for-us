import { describe, expect, it } from 'vitest'
import { classifyShow, FORM_WORDS } from '../scripts/catalog-classify.ts'
import { fetchListing, pullCatalog, summarySanity } from '../scripts/catalog-lib.ts'
import type { Fetcher } from '../scripts/pull-lib.ts'

// Intros below are paraphrased stand-ins for the real articles, not quoted Wikipedia text.
const JCS = 'Jesus Christ Superstar is a sung-through rock opera with music by Andrew Lloyd Webber.'
const COMET = 'Natasha, Pierre & The Great Comet of 1812 is a musical adapted from a section of War and Peace.'
const VAMPIRES = 'Dance of the Vampires is a musical based on a Polanski film.'
const FLORODORA = 'Florodora is an Edwardian musical comedy in two acts.'
const ALMAHIDE = 'Almahide is an opera in three acts, sung in Italian.'
const BAJAZET = 'Bajazet is an opera pasticcio first staged in Venice.'
const MESSIAH = 'The Messiah is an oratorio for soloists and choir.'

describe('classifyShow: text first, class as fallback', () => {
  it.each([
    ['rock opera counts as musical (overrides class-drop)', JCS, true, 'text-keep'],
    ['musical overrides class-drop', COMET, true, 'text-keep'],
    ['musical overrides class-drop (2)', VAMPIRES, true, 'text-keep'],
    ['musical comedy overrides class-drop', FLORODORA, true, 'text-keep'],
    ['opera overrides class-keep', ALMAHIDE, false, 'text-drop'],
    ['opera pasticcio overrides class-keep', BAJAZET, false, 'text-drop'],
    ['oratorio, class agrees', MESSIAH, true, 'text-drop'],
    ['musical, class agrees', COMET, false, 'text-keep'],
  ])('%s', (_name, text, excludedByClass, want) => {
    expect(classifyShow(text, excludedByClass)).toBe(want)
  })

  it('both signals: falls back to the class', () => {
    const both = 'It is an opera and also a musical.'
    expect(classifyShow(both, true)).toBe('class-drop')
    expect(classifyShow(both, false)).toBe('class-keep')
  })

  it('neither signal or no summary: falls back to the class', () => {
    expect(classifyShow('A show about a cat.', true)).toBe('class-drop')
    expect(classifyShow('A show about a cat.', false)).toBe('class-keep')
    expect(classifyShow(undefined, true)).toBe('class-drop')
    expect(classifyShow(undefined, false)).toBe('class-keep')
  })

  it('only looks at the first 250 characters', () => {
    const late = `${'A show about a cat. '.repeat(14)}It is an opera.`
    expect(late.indexOf('opera')).toBeGreaterThan(250)
    expect(classifyShow(late, false)).toBe('class-keep')
  })

  it('is case-insensitive; folk/pop opera count as musical; accented opéra is a drop word', () => {
    expect(classifyShow('X is a Folk Opera.', true)).toBe('text-keep')
    expect(classifyShow('X is a pop opera.', true)).toBe('text-keep')
    expect(classifyShow('X is an Opéra comique.', false)).toBe('text-drop')
    expect(classifyShow('X is a Ballet.', false)).toBe('text-drop')
  })

  it('whole words only: "musicals"/"operations" do not match', () => {
    expect(classifyShow('X deals with operations.', true)).toBe('class-drop')
    expect(classifyShow('X is about musicals.', false)).toBe('class-keep')
  })
})

describe('polish (#18)', () => {
  const THREEPENNY = 'The Threepenny Opera is a play with music by Kurt Weill, adapted from John Gay\'s ballad opera, The Beggar\'s Opera.'
  it('"play with music" counts as musical', () => {
    expect(classifyShow('X is a play with music by Y.', true)).toBe('text-keep')
  })
  it('Threepenny is not text-drop (own title stripped; the Beggar\'s Opera mention makes it mixed)', () => {
    expect(classifyShow(THREEPENNY, false, 'The Threepenny Opera')).not.toBe('text-drop')
    expect(classifyShow('The Threepenny Opera is a play with music by Kurt Weill.', true, 'The Threepenny Opera')).toBe('text-keep')
  })
  it('an opera whose title contains "Opera" is still text-drop; title stripped ignores "(disambiguation)"', () => {
    expect(classifyShow('The Opera Ghost is an opera in two acts.', false, 'The Opera Ghost')).toBe('text-drop')
    expect(classifyShow('Opera Night (opera) is a one-act opera.', false, 'Opera Night (opera)')).toBe('text-drop')
  })
  it.each(['ballets', 'operettas', 'opéras', 'oratorios', 'cantatas', 'masques', 'zarzuelas', 'operas'])('plural %s is a form word', (w) => {
    expect(classifyShow(`X is among the ${w} of Y.`, false)).toBe('text-drop')
  })
  it.each(['rock opera', 'rock-opera', 'folk operas', 'pop-opera', 'Rock Operas'])('%s counts as musical', (w) => {
    expect(classifyShow(`X is a ${w} by Y.`, true)).toBe('text-keep')
  })
  it('one shared form-word regex serves the summary sanity metric', () => {
    expect(FORM_WORDS.test('ballets')).toBe(true)
    const shows = [{ title: 'A', summary: { text: 'A is among the zarzuelas.' } }, { title: 'B', summary: { text: 'B is a play with music.' } }] as never
    expect(summarySanity(shows).suspect).toBe(1)
    expect(summarySanity(shows).musical).toBe(1)
  })
})

const bind = (qid: string, title: string, excluded?: string) => ({
  item: { type: 'uri', value: `http://www.wikidata.org/entity/${qid}` },
  enwiki: { type: 'literal', value: title },
  ...(excluded ? { excludedByClass: { type: 'literal', value: excluded } } : {}),
})

describe('listing keeps everything and reports excludedByClass', () => {
  it('parses the boolean; missing means false', async () => {
    const f: Fetcher = async () => ({ results: { bindings: [bind('Q1', 'A', 'true'), bind('Q2', 'B', 'false'), bind('Q3', 'C')] } })
    const out = await fetchListing(f)
    expect(out.map((e) => e.excludedByClass)).toEqual([true, false, false])
  })
})

describe('pullCatalog applies the classification', () => {
  const items = [
    bind('Q1', 'Jesus Christ Superstar', 'true'),
    bind('Q2', 'Almahide', 'false'),
    bind('Q3', 'Plain Class Keep', 'false'),
    bind('Q4', 'Plain Class Drop', 'true'),
    bind('Q5', 'Florodora', 'true'),
  ]
  const text: Record<string, string> = {
    'Jesus Christ Superstar': JCS,
    Almahide: ALMAHIDE,
    Florodora: FLORODORA,
  }
  function run() {
    const detailQids: string[] = []
    const fetcher: Fetcher = async (req) => {
      if (req.path.startsWith('catalog/list')) return { results: { bindings: items } }
      if (req.path.startsWith('catalog/items')) {
        detailQids.push(...(decodeURIComponent(req.url).match(/wd:Q\d+/g) ?? []))
        return { results: { bindings: [] } }
      }
      const titles = (new URL(req.url).searchParams.get('titles') ?? '').split('|')
      return { batchcomplete: true, query: { pages: titles.map((t) => ({ title: t, extract: text[t] })) } }
    }
    const logs: string[] = []
    const shows = pullCatalog([], fetcher, { log: (m) => logs.push(m) })
    return { shows, detailQids, logs }
  }

  it('keeps text-keep and class-keep, drops the rest; details only for kept', async () => {
    const { shows, detailQids } = run()
    expect((await shows).map((s) => s.title).sort()).toEqual(['Florodora', 'Jesus Christ Superstar', 'Plain Class Keep'])
    expect(detailQids.sort()).toEqual(['wd:Q1', 'wd:Q3', 'wd:Q5'])
  })

  it('logs counts per decision path and the overriding examples', async () => {
    const { shows, logs } = run()
    await shows
    const text = logs.join('\n')
    expect(text).toMatch(/text-keep: 2/)
    expect(text).toMatch(/text-drop: 1/)
    expect(text).toMatch(/class-keep: 1/)
    expect(text).toMatch(/class-drop: 1/)
    expect(text).toMatch(/text-keep overriding class \(2\)[^\n]*Jesus Christ Superstar; Florodora/)
    expect(text).toMatch(/text-drop overriding class \(1\)[^\n]*Almahide/)
  })
})
