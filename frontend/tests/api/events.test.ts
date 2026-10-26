import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { handleEvents, mapEvents } from '../../api/_lib/events.ts'
import { isValidSlug, keywordForSlug } from '../../api/_lib/shows.ts'

const fixture = JSON.parse(
  readFileSync(new URL('../../fixtures/ticketmaster/discovery-hamilton.json', import.meta.url), 'utf8'),
)
const KEY = 'sekrit-key-1234567890'
const now = () => new Date('2026-10-26T12:00:00.123Z')
const okFetch = () =>
  vi.fn(async (u: RequestInfo | URL) => (void u, new Response(JSON.stringify(fixture), { status: 200 })))
const asFetch = (f: unknown) => f as typeof fetch

describe('events core', () => {
  it('returns filtered events sorted by date with url, venue, city', async () => {
    const res = await handleEvents('hamilton', { fetch: asFetch(okFetch()), apiKey: KEY, now })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.events.map((e: { id: string }) => e.id)).toEqual(['evt-early', 'evt-notime', 'evt-late'])
    expect(body.events[0]).toEqual({
      id: 'evt-early', name: 'HAMILTON', date: '2026-11-05', time: '19:00:00',
      url: 'https://www.ticketmaster.com/event/evt-early',
      venue: 'Richard Rodgers Theatre', city: 'New York', state: 'NY',
    })
    expect(body.events[1].time).toBeNull()
  })

  it('queries Discovery with the expected params', async () => {
    const f = okFetch()
    await handleEvents('les-miserables', { fetch: asFetch(f), apiKey: KEY, now })
    const url = new URL(String(f.mock.calls[0][0]))
    expect(url.host).toBe('app.ticketmaster.com')
    expect(url.searchParams.get('keyword')).toBe('Les Misérables')
    expect(url.searchParams.get('classificationName')).toBe('Theatre')
    expect(url.searchParams.get('sort')).toBe('date,asc')
    expect(url.searchParams.get('countryCode')).toBe('US')
    expect(Number(url.searchParams.get('size'))).toBeLessThanOrEqual(50)
    expect(url.searchParams.get('startDateTime')).toBe('2026-10-26T12:00:00Z')
  })

  it('matches accent-insensitively', async () => {
    const raw = { _embedded: { events: [{ id: '1', name: 'LES MISERABLES', url: 'u', dates: { start: { localDate: '2026-11-01' } } }] } }
    const f = vi.fn(async () => new Response(JSON.stringify(raw)))
    const res = await handleEvents('les-miserables', { fetch: asFetch(f), apiKey: KEY, now })
    expect((await res.json()).events).toHaveLength(1)
  })

  it('sets short Cache-Control', async () => {
    const res = await handleEvents('hamilton', { fetch: asFetch(okFetch()), apiKey: KEY, now })
    const cc = res.headers.get('cache-control') ?? ''
    const max = Number(/max-age=(\d+)/.exec(cc)?.[1])
    const smax = Number(/s-maxage=(\d+)/.exec(cc)?.[1])
    expect(max).toBeGreaterThan(0)
    expect(max).toBeLessThanOrEqual(3600)
    expect(smax).toBeGreaterThan(0)
    expect(smax).toBeLessThanOrEqual(3600)
  })

  it('returns 200 with empty events and reason when key is unset, without fetching', async () => {
    const f = okFetch()
    const res = await handleEvents('hamilton', { fetch: asFetch(f), apiKey: undefined, now })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.events).toEqual([])
    expect(typeof body.reason).toBe('string')
    expect(f).not.toHaveBeenCalled()
  })

  it('returns 502 on non-2xx and never leaks the key', async () => {
    const f = vi.fn(async () => new Response(`bad apikey=${KEY}`, { status: 401 }))
    const res = await handleEvents('hamilton', { fetch: asFetch(f), apiKey: KEY, now })
    expect(res.status).toBe(502)
    const text = await res.text()
    expect(JSON.parse(text).error).toBeTruthy()
    expect(text).not.toContain(KEY)
  })

  it('returns 502 on network error and never leaks the key', async () => {
    const f = vi.fn(async (u: RequestInfo | URL) => {
      throw new Error(`connect failed ${String(u)}`)
    })
    const res = await handleEvents('hamilton', { fetch: asFetch(f), apiKey: KEY, now })
    expect(res.status).toBe(502)
    const text = await res.text()
    expect(JSON.parse(text).error).toBeTruthy()
    expect(text).not.toContain(KEY)
  })

  it('returns 502 on unparseable upstream body', async () => {
    const f = vi.fn(async () => new Response('<html>', { status: 200 }))
    const res = await handleEvents('hamilton', { fetch: asFetch(f), apiKey: KEY, now })
    expect(res.status).toBe(502)
  })

  it('returns 400 for missing or invalid show', async () => {
    for (const s of [null, '', 'Bad Slug!', '../x']) {
      const res = await handleEvents(s, { fetch: asFetch(okFetch()), apiKey: KEY, now })
      expect(res.status).toBe(400)
    }
  })
})

describe('unknown shows', () => {
  it('404s a well-formed slug that is not a flagship, without calling Ticketmaster', async () => {
    for (const s of ['made-up-show', 'constructor', 'tostring']) {
      const f = okFetch()
      const res = await handleEvents(s, { fetch: asFetch(f), apiKey: KEY, now })
      expect(res.status).toBe(404)
      expect(await res.json()).toEqual({ error: 'Unknown show' })
      expect(f).not.toHaveBeenCalled()
    }
  })
})

describe('GET handler', () => {
  it('reads the key from process.env and 400s without show', async () => {
    const { GET } = await import('../../api/events.ts')
    expect((await GET(new Request('https://x.test/api/events'))).status).toBe(400)
    const prev = process.env.TICKETMASTER_API_KEY
    delete process.env.TICKETMASTER_API_KEY
    try {
      const res = await GET(new Request('https://x.test/api/events?show=hamilton'))
      expect(res.status).toBe(200)
      expect((await res.json()).events).toEqual([])
    } finally {
      if (prev !== undefined) process.env.TICKETMASTER_API_KEY = prev
    }
  })
})

describe('keywordForSlug', () => {
  it('maps flagship slugs and rejects others', () => {
    expect(keywordForSlug('hamilton')).toBe('Hamilton')
    expect(keywordForSlug('les-miserables')).toBe('Les Misérables')
    expect(keywordForSlug('the-lion-king')).toBe('The Lion King')
    expect(keywordForSlug('made-up-show')).toBeUndefined()
  })
})

describe('mapEvents title matching', () => {
  const ev = (id: string, name: string) => ({
    id, name, url: `https://tm.example/${id}`, dates: { start: { localDate: '2026-11-01' } },
  })
  it('matches the title as a whole word only', () => {
    const raw = { _embedded: { events: [ev('a', 'SIX (Touring)'), ev('b', 'Sixteen Candles'), ev('c', 'Six')] } }
    expect(mapEvents(raw, 'Six').map(e => e.id)).toEqual(['a', 'c'])
  })
})

describe('flagship coverage', () => {
  it('every flagship slug is accepted and searches for its title', () => {
    const raw = JSON.parse(readFileSync(new URL('../../data/flagships.json', import.meta.url), 'utf8'))
    const flagships: { slug: string; title: string }[] = Array.isArray(raw) ? raw : raw.shows
    for (const f of flagships) {
      expect(isValidSlug(f.slug)).toBe(true)
      expect(keywordForSlug(f.slug)).toBe(f.title)
    }
  })
})
