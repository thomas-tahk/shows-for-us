import { existsSync, mkdirSync, rmSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { Flagship } from '../src/data/show.ts'
import { shardOf, type CatalogIndex, type CatalogShard, type CatalogShow } from '../src/data/catalogShow.ts'
import { offlineFetcher } from '../scripts/fetchers.ts'
import { itemsQuery, type Fetcher, type PullRequest } from '../scripts/pull-lib.ts'
import { EXCLUDED_CLASSES, assignSlugs, buildIndex, classBreakdownQuery, excludedClassBreakdownQuery, extractsRequest, groupShards, listingQuery, propertyBreakdownQuery, pullCatalog, slugify, summarySanity } from '../scripts/catalog-lib.ts'
import { runCatalog } from '../scripts/catalog-run.ts'

const flagships = JSON.parse(readFileSync('data/flagships.json', 'utf8')) as Flagship[]
const fixtures = offlineFetcher('fixtures')
const shows = await pullCatalog(flagships, fixtures)
const bySlug = (slug: string): CatalogShow => {
  const s = shows.find((x) => x.slug === slug)
  if (!s) throw new Error(`no show ${slug}: have ${shows.map((x) => x.slug).join(', ')}`)
  return s
}

describe('slug rule', () => {
  it('slugifies', () => {
    expect(slugify('Les Misérables')).toBe('les-miserables')
    expect(slugify("Guys & Dolls: it's!")).toBe('guys-dolls-it-s')
  })

  const entry = (qid: string, enwiki: string) => ({ qid, enwiki })

  it('drops a trailing parenthetical', () => {
    const m = assignSlugs([entry('Q1', 'Chicago (musical)'), entry('Q2', 'Show Boat')], new Set())
    expect(m.get('Q1')).toBe('chicago')
    expect(m.get('Q2')).toBe('show-boat')
  })

  it('collision between catalogue shows falls back to the full title', () => {
    const m = assignSlugs([entry('Q1', 'Aladdin (musical)'), entry('Q2', 'Aladdin (pantomime)'), entry('Q3', 'Cats')], new Set())
    expect(m.get('Q1')).toBe('aladdin-musical')
    expect(m.get('Q2')).toBe('aladdin-pantomime')
    expect(m.get('Q3')).toBe('cats')
  })

  it('collision with a flagship slug falls back to the full title', () => {
    const m = assignSlugs([entry('Q9', 'Rent (1990s musical)')], new Set(['rent']))
    expect(m.get('Q9')).toBe('rent-1990s-musical')
    expect(assignSlugs([entry('Q9', 'Rent (musical)')], new Set(['rent'])).get('Q9')).toBe('rent-musical')
  })

  it('still colliding appends the lowercase Q-id', () => {
    const m = assignSlugs([entry('Q9', 'Hamilton'), entry('Q10', 'Hamilton (1)'), entry('Q11', 'Hamilton (musical)')], new Set(['hamilton']))
    expect(m.get('Q9')).toBe('hamilton-q9')
    expect(m.get('Q10')).toBe('hamilton-1')
    expect(m.get('Q11')).toBe('hamilton-musical')
    const dup = assignSlugs([entry('Q5', 'Foo (a b)'), entry('Q6', 'Foo (a-b)')], new Set())
    expect([dup.get('Q5'), dup.get('Q6')]).toEqual(['foo-a-b-q5', 'foo-a-b-q6'])
  })

  it('does not depend on input order', () => {
    const a = [entry('Q1', 'Aladdin (musical)'), entry('Q2', 'Aladdin (pantomime)')]
    expect([...assignSlugs([...a].reverse(), new Set())].sort()).toEqual([...assignSlugs(a, new Set())].sort())
  })
})

describe('offline catalogue from fixtures', () => {
  it('excludes flagships by Q-id and by enwiki title', () => {
    const slugs = shows.map((s) => s.slug)
    expect(shows.find((s) => s.qid === 'Q19320959')).toBeUndefined() // flagship Q-id
    expect(shows.find((s) => s.enwiki === 'The Lion King (musical)')).toBeUndefined() // flagship title, unknown Q-id
    expect(slugs).toEqual(expect.arrayContaining(['show-boat', 'the-robber-bridegroom', 'chicago']))
    expect(shows.length).toBeGreaterThanOrEqual(8)
  })

  it('Show Boat has the IBDB link and person IBDB link', () => {
    const s = bySlug('show-boat')
    expect(s.links.ibdb).toBe('https://www.ibdb.com/broadway-show/4367')
    expect(s.composers).toEqual([{ name: 'Jerome Kern', qid: 'Q1000001', ibdb_url: 'https://www.ibdb.com/broadway-cast-staff/9999901' }])
    expect(s.premiere).toEqual({ date: '1927-12-27', venue: 'Ziegfeld Theatre' })
  })

  it('Chicago: slug from enwiki minus parenthetical, all links', () => {
    const s = bySlug('chicago')
    expect(s.title).toBe('Chicago')
    expect(s.enwiki).toBe('Chicago (musical)')
    expect(s.links).toEqual({
      ibdb: 'https://www.ibdb.com/broadway-show/3',
      playbill: 'https://playbill.com/production/chicago-placeholder-0000000003',
      official_site: 'https://chicagothemusical.com',
      wikipedia: 'https://en.wikipedia.org/wiki/Chicago_(musical)',
      wikidata: 'https://www.wikidata.org/wiki/Q1000020',
    })
    expect(s.awards).toEqual([{ name: 'Tony Award for Best Revival of a Musical', qid: 'Q1000201' }])
  })

  it('wikipedia + wikidata links are always present; optional links absent when no data', () => {
    for (const s of shows) {
      expect(s.links.wikipedia).toMatch(/^https:\/\/en\.wikipedia\.org\/wiki\//)
      expect(s.links.wikidata).toBe(`https://www.wikidata.org/wiki/${s.qid}`)
    }
    expect(bySlug('the-robber-bridegroom').links).not.toHaveProperty('ibdb')
  })

  it('collision case gets full-title slugs', () => {
    expect(bySlug('aladdin-musical').enwiki).toBe('Aladdin (musical)')
    expect(bySlug('aladdin-pantomime').title).toBe('Aladdin')
    expect(shows.find((s) => s.slug === 'aladdin')).toBeUndefined()
  })

  it('premiere is the earliest date, with Wikidata precision', () => {
    expect(bySlug('candide').premiere.date).toBe('1956-10-29')
    expect(bySlug('aladdin-pantomime').premiere.date).toBe('1788')
    expect(bySlug('unlabelled-credits').premiere.date).toBe('1999-03')
    expect(bySlug('hair').premiere).toEqual({ date: null, venue: null })
  })

  it('drops credits, venues without an English label', () => {
    const s = bySlug('unlabelled-credits')
    expect(s.composers).toEqual([]) // label service returned the Q-id
    expect(s.lyricists).toEqual([]) // no label at all
    expect(s.librettists.map((p) => p.name)).toEqual(['Fred Ebb'])
    expect(s.premiere.venue).toBeNull()
  })

  it('summary: CC BY-SA, unmodified, source = article URL; follows redirects and continue', () => {
    expect(bySlug('chicago').summary).toEqual({
      text: expect.stringContaining('Chicago (musical)'),
      source_url: 'https://en.wikipedia.org/wiki/Chicago_(musical)',
      license: 'CC BY-SA 4.0',
      modified: false,
    })
    expect(bySlug('show-boat').summary?.text).toContain('Show Boat') // arrived in the continuation
    expect(bySlug('old-title')?.summary?.text).toContain('New Title') // redirect
    expect(bySlug('unlabelled-credits').summary).toBeNull() // missing page
  })

  it('index: year, up to 3 de-duplicated creators, sorted by title then slug', () => {
    const idx = buildIndex(shows)
    const e = (slug: string) => idx.find((x) => x.slug === slug)
    expect(e('show-boat')).toEqual({ slug: 'show-boat', title: 'Show Boat', year: '1927', creators: ['Jerome Kern', 'Oscar Hammerstein II'] })
    expect(e('chicago')?.creators).toEqual(['John Kander', 'Fred Ebb', 'Bob Fosse'])
    expect(e('candide')?.creators).toHaveLength(3)
    expect(e('hair')?.year).toBeNull()
    const keys = idx.map((x) => `${x.title}\u0000${x.slug}`)
    expect(keys).toEqual([...keys].sort())
    expect(idx.map((x) => x.slug).slice(0, 2)).toEqual(['aladdin-musical', 'aladdin-pantomime'])
  })

  it('shards: grouped by shardOf, records sorted by slug', () => {
    const grouped = groupShards(shows, false)
    expect([...grouped.keys()].every((k) => /^\d{3}$/.test(k))).toBe(true)
    let n = 0
    for (const [shard, rec] of grouped) {
      const slugs = Object.keys(rec.shows)
      expect(slugs).toEqual([...slugs].sort())
      for (const s of slugs) expect(shardOf(s)).toBe(shard)
      n += slugs.length
    }
    expect(n).toBe(shows.length)
  })
})

// ---- query design ------------------------------------------------------------

function stub(total: number) {
  const reqs: PullRequest[] = []
  const fetcher: Fetcher = async (req) => {
    reqs.push(req)
    if (req.path.startsWith('catalog/list')) {
      const bindings = Array.from({ length: total }, (_, i) => ({
        item: { type: 'uri', value: `http://www.wikidata.org/entity/Q${5000 + i}` },
        enwiki: { type: 'literal', value: `Show ${i} (musical)` },
      }))
      return { results: { bindings } }
    }
    if (req.path.startsWith('catalog/items')) return { results: { bindings: [] } }
    return { batchcomplete: true, query: { pages: [] } }
  }
  return { reqs, fetcher }
}

describe('extracts errors', () => {
  const failing = (body: unknown): Fetcher => async (req) => {
    if (req.path.startsWith('catalog/list'))
      return { results: { bindings: [{ item: { type: 'uri', value: 'http://www.wikidata.org/entity/Q1' }, enwiki: { type: 'literal', value: 'One' } }] } }
    if (req.path.startsWith('catalog/items')) return { results: { bindings: [] } }
    return body
  }
  it('throws on a 200 response carrying {error}', async () => {
    await expect(pullCatalog([], failing({ error: { code: 'internal_api_error', info: 'x' } }))).rejects.toThrow(/internal_api_error|error/)
  })
  it('throws when the response has no query', async () => {
    await expect(pullCatalog([], failing({ batchcomplete: true }))).rejects.toThrow(/query/)
  })
  it('extractsRequest takes an object', () => {
    const r = extractsRequest({ titles: ['A', 'B'], batch: 1, part: 2, cont: { excontinue: 3 } })
    expect(r.path).toBe('catalog/extracts.001.2.json')
    expect(r.url).toContain('excontinue=3')
  })
})

describe('query batching', () => {
  it('lists everything with one SELECT DISTINCT query, no paging', async () => {
    const { reqs, fetcher } = stub(5)
    expect(await pullCatalog([], fetcher)).toHaveLength(5)
    const lists = reqs.filter((r) => r.path.startsWith('catalog/list'))
    expect(lists).toHaveLength(1)
    const q = decodeURIComponent(lists[0].url)
    expect(q).toContain('SELECT DISTINCT')
    expect(q).not.toMatch(/LIMIT|OFFSET/)
  })

  it('listing excludes opera, operetta, oratorio, ballet, cantata, ballet (work), masques via P31|P136|P7937 + subclasses', () => {
    const q = listingQuery()
    const ids = [
      ['Q1344', 'opera'],
      ['Q170384', 'operetta'],
      ['Q85477', 'oratorio'],
      ['Q41425', 'ballet'],
      ['Q174873', 'cantata'],
      ['Q15079786', 'ballet (work)'],
      ['Q2207959', 'masque'],
      ['Q1907293', 'Masque'],
    ]
    expect(EXCLUDED_CLASSES).toEqual(ids.map(([id]) => id))
    expect(q).toContain('FILTER NOT EXISTS { ?item (wdt:P31|wdt:P136|wdt:P7937)/wdt:P279* ?bad . VALUES ?bad { ')
    for (const [id] of ids) expect(q).toContain(`wd:${id}`)
    expect(q.indexOf('FILTER NOT EXISTS')).toBeGreaterThan(q.indexOf('Q58483083'))
    for (const wrong of ['Q182832', 'Q2742', 'Q169034']) expect(q).not.toContain(wrong)
  })

  it('class queries: kept uses a grouping subquery with labels outside; excluded mirrors it', () => {
    const kept = classBreakdownQuery()
    expect(kept).toContain('FILTER NOT EXISTS')
    expect(kept.indexOf('SERVICE wikibase:label')).toBeGreaterThan(kept.lastIndexOf('GROUP BY'))
    expect(kept).toContain('LIMIT 40')
    const out = excludedClassBreakdownQuery()
    expect(out).not.toContain('FILTER NOT EXISTS')
    expect(out).toContain('LIMIT 20')
    expect(out.indexOf('SERVICE wikibase:label')).toBeGreaterThan(out.lastIndexOf('GROUP BY'))
  })

  it.each(['P136', 'P7937'])('%s value breakdown: top 30, kept and excluded, labels outside the grouping', (prop) => {
    const kept = propertyBreakdownQuery(prop, false)
    const out = propertyBreakdownQuery(prop, true)
    for (const q of [kept, out]) {
      expect(q).toContain(`?item wdt:${prop} ?cls`)
      expect(q).toContain('LIMIT 30')
      expect(q.indexOf('SERVICE wikibase:label')).toBeGreaterThan(q.lastIndexOf('GROUP BY'))
    }
    expect(kept).toContain('FILTER NOT EXISTS')
    expect(out).not.toContain('FILTER NOT EXISTS')
    expect(out).toContain('VALUES ?bad')
  })

  it('summary sanity: opera-ish first sentence without "musical" is counted; examples capped at 10', () => {
    const show = (title: string, text: string | null) => ({ title, summary: text ? { text } : null })
    const shows = [
      ...Array.from({ length: 12 }, (_, i) => show(`Op ${i}`, 'Op is a comic opera in two acts. It is a musical favourite.')),
      show('Both', 'Both is an opera and a musical.'),
      show('Later', 'Later is a work. It was once an opera.'),
      show('Plain', 'Plain is a musical.'),
      show('None', null),
    ]
    const r = summarySanity(shows as Parameters<typeof summarySanity>[0])
    expect(r.suspect).toBe(12)
    expect(r.examples).toHaveLength(10)
    expect(r.musical).toBe(2)
  })

  it('logs excluded count and both class breakdowns, after details and extracts, via the diagnostic fetcher', async () => {
    const logs: string[] = []
    const row = (q: string, l: string, n: number) => ({
      cls: { type: 'uri', value: `http://www.wikidata.org/entity/${q}` },
      clsLabel: { type: 'literal', value: l },
      n: { type: 'literal', value: String(n) },
    })
    const main = stub(1)
    const diagPaths: string[] = []
    const diagnostic: Fetcher = async (req) => {
      diagPaths.push(req.path)
      if (req.path === 'catalog/excluded.json') return { results: { bindings: [{ n: { type: 'literal', value: '4321' } }] } }
      if (req.path === 'catalog/classes.json') return { results: { bindings: [row('Q2743', 'musical theatre', 900)] } }
      return { results: { bindings: [row('Q1344', 'opera', 3000)] } }
    }
    await pullCatalog([], main.fetcher, { log: (m) => logs.push(m), diagnosticFetcher: diagnostic })
    const text = logs.join('\n')
    expect(text).toMatch(/excluded.*4321|4321.*excluded/i)
    expect(text).toMatch(/Q2743\s+musical theatre\s+900/)
    expect(text).toMatch(/Q1344\s+opera\s+3000/)
    expect(text).toMatch(/P136/)
    expect(text).toMatch(/P7937/)
    expect(text).toMatch(/first sentence/i)
    expect(diagPaths).toHaveLength(7)
    expect(main.reqs.some((r) => r.path.startsWith('catalog/classes') || r.path.startsWith('catalog/excluded'))).toBe(false)
    expect(logs.findIndex((m) => /^extracts:/.test(m))).toBeLessThan(logs.findIndex((m) => /excluded/i.test(m)))
  })

  it('a failing diagnostic query does not fail the pull', async () => {
    const logs: string[] = []
    const diagnostic: Fetcher = async () => {
      throw new Error('boom')
    }
    expect(await pullCatalog([], stub(3).fetcher, { log: (m) => logs.push(m), diagnosticFetcher: diagnostic })).toHaveLength(3)
    expect(logs.join('\n')).toMatch(/breakdown.*unavailable|unavailable.*breakdown/i)
  })

  it('asks the label service for en then mul', () => {
    expect(itemsQuery(['Q1'])).toContain('"en,mul"')
  })

  it('detail queries: 100 Q-ids per VALUES batch; extracts: 20 titles per request', async () => {
    const { reqs, fetcher } = stub(230)
    await pullCatalog([], fetcher)
    const items = reqs.filter((r) => r.path.startsWith('catalog/items'))
    expect(items.map((r) => (decodeURIComponent(r.url).match(/wd:Q\d+/g) ?? []).length)).toEqual([100, 100, 30])
    expect(decodeURIComponent(items[0].url)).toContain('SERVICE wikibase:label')
    const ex = reqs.filter((r) => r.path.startsWith('catalog/extracts'))
    expect(ex).toHaveLength(12)
    for (const r of ex) {
      const u = new URL(r.url)
      expect(u.origin + u.pathname).toBe('https://en.wikipedia.org/w/api.php')
      expect(u.searchParams.get('action')).toBe('query')
      expect(u.searchParams.get('prop')).toBe('extracts')
      expect(u.searchParams.has('exintro')).toBe(true)
      expect(u.searchParams.has('explaintext')).toBe(true)
      expect(u.searchParams.get('formatversion')).toBe('2')
      expect(u.searchParams.get('redirects')).toBe('1')
      expect((u.searchParams.get('titles') ?? '').split('|').length).toBeLessThanOrEqual(20)
    }
    expect(new Set(reqs.map((r) => r.path)).size).toBe(reqs.length) // unique fixture paths
  })

  it('follows `continue` by re-requesting with its parameters', async () => {
    const calls: string[] = []
    const fetcher: Fetcher = async (req) => {
      calls.push(req.url)
      if (req.path.startsWith('catalog/list'))
        return { results: { bindings: [{ item: { type: 'uri', value: 'http://www.wikidata.org/entity/Q1' }, enwiki: { type: 'literal', value: 'One' } }] } }
      if (req.path.startsWith('catalog/items')) return { results: { bindings: [] } }
      return calls.filter((c) => c.includes('excontinue')).length
        ? { batchcomplete: true, query: { pages: [{ title: 'One', extract: 'Second pass.' }] } }
        : { continue: { excontinue: 1, continue: '||' }, query: { pages: [{ title: 'One' }] } }
    }
    const out = await pullCatalog([], fetcher)
    expect(out[0].summary?.text).toBe('Second pass.')
    expect(calls.filter((c) => c.includes('api.php')).at(-1)).toContain('excontinue=1')
  })
})

// ---- run: writing, guards, failure ---------------------------------------------

const made: string[] = []
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'catalog-'))
  made.push(d)
  return d
}
afterAll(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })))
const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T
const snapshot = (dir: string): Record<string, string> =>
  Object.fromEntries(
    ['index.json', ...(existsSync(join(dir, 'shows')) ? readdirSync(join(dir, 'shows')).map((f) => `shows/${f}`) : [])].map((f) => [
      f,
      existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : '',
    ]),
  )
const opts = (outDir: string, over: Partial<Parameters<typeof runCatalog>[0]> = {}) => ({
  fetcher: fixtures,
  flagships,
  outDir,
  mode: 'offline-fixtures' as const,
  now: () => '2026-11-04T00:00:00.000Z',
  log: () => {},
  ...over,
})

describe('runCatalog', () => {
  it('writes index.json + shards; meta is offline-fixtures; deterministic', async () => {
    const dir = tmp()
    expect(await runCatalog(opts(dir))).toBe(0)
    const idx = read<CatalogIndex>(join(dir, 'index.json'))
    expect(idx.meta).toEqual({ generated_at: '2026-11-04T00:00:00.000Z', mode: 'offline-fixtures', live: false, count: shows.length })
    expect(idx.shows).toHaveLength(shows.length)
    const first = snapshot(dir)
    const again = tmp()
    await runCatalog(opts(again))
    expect(snapshot(again)).toEqual(first)
    const shard = read<CatalogShard>(join(dir, 'shows', `${shardOf('chicago')}.json`))
    expect(shard.shows.chicago.enwiki).toBe('Chicago (musical)')
  })

  it('live mode sets live true', async () => {
    const dir = tmp()
    await runCatalog(opts(dir, { mode: 'live' }))
    expect(read<CatalogIndex>(join(dir, 'index.json')).meta).toMatchObject({ mode: 'live', live: true })
  })

  it('offline run refuses to replace a live catalogue', async () => {
    const dir = tmp()
    writeFileSync(join(dir, 'index.json'), JSON.stringify({ meta: { mode: 'live', live: true, count: 5900 }, shows: [] }))
    const before = snapshot(dir)
    const logs: string[] = []
    expect(await runCatalog(opts(dir, { log: (m) => logs.push(m) }))).toBe(1)
    expect(snapshot(dir)).toEqual(before)
    expect(logs.join('\n')).toMatch(/offline.*live|live.*offline/i)
  })

  it('deletes stale shard files', async () => {
    const dir = tmp()
    mkdirSync(join(dir, 'shows'))
    writeFileSync(join(dir, 'shows', '999.json'), '{}')
    writeFileSync(join(dir, 'shows', 'notes.txt'), 'keep')
    await runCatalog(opts(dir))
    expect(existsSync(join(dir, 'shows', '999.json'))).toBe(false)
    expect(existsSync(join(dir, 'shows', 'notes.txt'))).toBe(true)
  })

  it('shrink guard: live run with < 90% of committed count writes nothing, says why, exits 1', async () => {
    const dir = tmp()
    mkdirSync(join(dir, 'shows'))
    const committed = { meta: { generated_at: 'x', mode: 'live', live: true, count: 100 }, shows: [] }
    writeFileSync(join(dir, 'index.json'), JSON.stringify(committed))
    writeFileSync(join(dir, 'shows', '001.json'), '{"shows":{}}')
    const before = snapshot(dir)
    const logs: string[] = []
    expect(await runCatalog(opts(dir, { mode: 'live', log: (m) => logs.push(m) }))).toBe(1)
    expect(snapshot(dir)).toEqual(before)
    expect(logs.join('\n')).toMatch(/shrink|90%/i)
  })

  it('shrink guard allows >= 90%', async () => {
    const dir = tmp()
    writeFileSync(join(dir, 'index.json'), JSON.stringify({ meta: { count: shows.length + 1 }, shows: [] }))
    expect(await runCatalog(opts(dir, { mode: 'live' }))).toBe(0)
  })

  it('allowShrink bypasses the guard, writes, and logs that it did', async () => {
    const dir = tmp()
    writeFileSync(join(dir, 'index.json'), JSON.stringify({ meta: { generated_at: 'x', mode: 'live', live: true, count: 100000 }, shows: [] }))
    const logs: string[] = []
    expect(await runCatalog(opts(dir, { mode: 'live', allowShrink: true, log: (m) => logs.push(m) }))).toBe(0)
    expect(logs.join('\n')).toMatch(/allow-shrink/)
    expect(read<CatalogIndex>(join(dir, 'index.json')).meta.count).toBe(shows.length)
  })

  it('without allowShrink the same shrink is refused', async () => {
    const dir = tmp()
    writeFileSync(join(dir, 'index.json'), JSON.stringify({ meta: { count: 100000 }, shows: [] }))
    expect(await runCatalog(opts(dir, { mode: 'live' }))).toBe(1)
  })

  it.each(['live', 'offline-fixtures'] as const)('every shard carries live matching the index (%s)', async (mode) => {
    const dir = tmp()
    expect(await runCatalog(opts(dir, { mode }))).toBe(0)
    const idx = read<CatalogIndex>(join(dir, 'index.json'))
    const files = readdirSync(join(dir, 'shows'))
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) expect(read<CatalogShard>(join(dir, 'shows', f)).live).toBe(idx.meta.live)
    expect(idx.meta.live).toBe(mode === 'live')
  })

  it('a failed request writes no files and exits 1', async () => {
    const dir = tmp()
    mkdirSync(join(dir, 'shows'))
    writeFileSync(join(dir, 'index.json'), JSON.stringify({ meta: { count: 1 }, shows: [] }))
    const before = snapshot(dir)
    const failing: Fetcher = async (req) => {
      if (req.path.startsWith('catalog/extracts')) throw new Error('HTTP 500')
      return fixtures(req)
    }
    const logs: string[] = []
    expect(await runCatalog(opts(dir, { fetcher: failing, log: (m) => logs.push(m) }))).toBe(1)
    expect(snapshot(dir)).toEqual(before)
    expect(logs.join('\n')).toContain('HTTP 500')
  })

  it('a failure on a fresh directory leaves it empty', async () => {
    const dir = join(tmp(), 'catalog')
    const failing: Fetcher = async () => {
      throw new Error('boom')
    }
    expect(await runCatalog(opts(dir, { fetcher: failing }))).toBe(1)
    expect(existsSync(dir)).toBe(false)
  })
})

describe('committed output', () => {
  it('index.json and shards agree (invariants only; content changes with each refresh)', () => {
    const idx = read<CatalogIndex>('public/catalog/index.json')
    expect(idx.meta.count).toBe(idx.shows.length)
    expect(['live', 'recorded-live', 'offline-fixtures']).toContain(idx.meta.mode)
    expect(idx.meta.live).toBe(idx.meta.mode !== 'offline-fixtures')
    const shards = new Map<string, CatalogShard>()
    for (const e of idx.shows) {
      const key = shardOf(e.slug)
      if (!shards.has(key)) shards.set(key, read<CatalogShard>(`public/catalog/shows/${key}.json`))
      expect(shards.get(key)?.shows[e.slug]?.slug).toBe(e.slug)
    }
  })
})
