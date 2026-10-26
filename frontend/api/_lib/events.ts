import { isValidSlug, keywordForSlug } from './shows.ts'

export interface ShowEvent {
  id: string
  name: string
  date: string
  time: string | null
  url: string
  venue: string | null
  city: string | null
  state: string | null
}

export interface EventsDeps {
  fetch: typeof fetch
  apiKey: string | undefined
  now: () => Date
}

const DISCOVERY_URL = 'https://app.ticketmaster.com/discovery/v2/events.json'
// Ticketmaster terms: no long-term storage of Event Content. Keep caching short.
const CACHE_CONTROL = 'public, max-age=300, s-maxage=900'

function json(body: unknown, status: number, cache = false): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache ? CACHE_CONTROL : 'no-store',
    },
  })
}

/** Lowercase and strip accents so "Les Misérables" matches "LES MISERABLES". */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

interface RawEvent {
  id?: string
  name?: string
  url?: string
  dates?: { start?: { localDate?: string; localTime?: string } }
  _embedded?: {
    venues?: Array<{
      name?: string
      city?: { name?: string }
      state?: { name?: string; stateCode?: string }
    }>
  }
}

export function mapEvents(raw: unknown, keyword: string): ShowEvent[] {
  const list = (raw as { _embedded?: { events?: RawEvent[] } } | null)?._embedded?.events
  if (!Array.isArray(list)) return []
  const needle = fold(keyword)
  const out: ShowEvent[] = []
  for (const e of list) {
    const date = e.dates?.start?.localDate
    if (!date || !e.id || !e.name || !e.url) continue
    if (!fold(e.name).includes(needle)) continue
    const v = e._embedded?.venues?.[0]
    out.push({
      id: e.id,
      name: e.name,
      date,
      time: e.dates?.start?.localTime ?? null,
      url: e.url,
      venue: v?.name ?? null,
      city: v?.city?.name ?? null,
      state: v?.state?.stateCode ?? v?.state?.name ?? null,
    })
  }
  return out.sort(
    (a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''),
  )
}

export async function handleEvents(slug: string | null, deps: EventsDeps): Promise<Response> {
  if (!isValidSlug(slug)) {
    return json({ error: 'Missing or invalid "show" parameter' }, 400)
  }
  if (!deps.apiKey) {
    return json({ events: [], reason: 'Ticketmaster is not configured (no API key)' }, 200)
  }
  const keyword = keywordForSlug(slug)
  const params = new URLSearchParams({
    apikey: deps.apiKey,
    keyword,
    classificationName: 'Theatre',
    countryCode: 'US',
    sort: 'date,asc',
    size: '50',
    startDateTime: deps.now().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  })
  let res: Response
  try {
    res = await deps.fetch(`${DISCOVERY_URL}?${params}`)
  } catch {
    return json({ error: 'Ticketmaster request failed' }, 502)
  }
  if (!res.ok) {
    return json({ error: 'Ticketmaster returned an error', upstreamStatus: res.status }, 502)
  }
  let body: unknown
  try {
    body = await res.json()
  } catch {
    return json({ error: 'Ticketmaster returned an unreadable response' }, 502)
  }
  return json({ events: mapEvents(body, keyword) }, 200, true)
}
