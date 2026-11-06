// Person hover-card data, fetched in the browser on first open and cached per qid.
// Wikidata wbgetentities -> enwiki title -> Wikipedia REST page summary.
// Any failure resolves to null: the card then shows the name only.
import type { SearchableEntry } from './search'

export interface PersonSummary {
  /** Wikipedia article title. */
  title: string
  /** Short Wikidata description, e.g. "American composer". */
  description: string | null
  /** Wikipedia intro text (CC BY-SA 4.0), at most two sentences, or null. */
  extract: string | null
  thumbnailUrl: string | null
  /** Wikipedia article URL. */
  pageUrl: string
}

const WIKIDATA = 'https://www.wikidata.org/w/api.php'
const SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/'

export const wikidataUrl = (qid: string) =>
  `${WIKIDATA}?action=wbgetentities&ids=${encodeURIComponent(qid)}&props=sitelinks|descriptions&sitefilter=enwiki&languages=en&format=json&origin=*`

export const summaryUrl = (title: string) => SUMMARY + encodeURIComponent(title.replace(/ /g, '_')).replace(/%28/g, '(').replace(/%29/g, ')')

interface WikidataResponse {
  entities?: Record<string, { sitelinks?: { enwiki?: { title?: string } }; descriptions?: { en?: { value?: string } } }>
}

export function parseWikidata(json: WikidataResponse, qid: string): { enwiki: string | null; description: string | null } {
  const entity = json.entities?.[qid]
  return { enwiki: entity?.sitelinks?.enwiki?.title ?? null, description: entity?.descriptions?.en?.value ?? null }
}

interface SummaryResponse {
  type?: string
  title?: string
  description?: string
  extract?: string
  thumbnail?: { source?: string }
  content_urls?: { desktop?: { page?: string } }
}

function splitSentences(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('en', { granularity: 'sentence' })
    const out: string[] = []
    for (const { segment } of seg.segment(text)) {
      // Segmenter splits after an initial ("J. K. Rowling"): glue it to what follows.
      const last = out.length - 1
      if (last >= 0 && /(^|\s)[A-Z]\.\s*$/.test(out[last])) out[last] += segment
      else out.push(segment)
    }
    return out
  }
  return text.match(/[^.!?]+(?:[.!?]+["'\u201d\u2019)]*(?=\s|$)|$)/g) ?? [text]
}

/** At most `count` sentences (Intl.Segmenter where available, a simple splitter otherwise). */
export function firstSentences(text: string, count = 2): string {
  return splitSentences(text).slice(0, count).map(s => s.trim()).filter(Boolean).join(' ')
}

export function parseSummary(json: SummaryResponse, fallbackDescription: string | null): PersonSummary | null {
  if (!json.title || json.type === 'disambiguation') return null
  const pageUrl = json.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(json.title.replace(/ /g, '_'))}`
  return {
    title: json.title,
    description: json.description ?? fallbackDescription,
    extract: json.extract ? firstSentences(json.extract) : null,
    thumbnailUrl: json.thumbnail?.source ?? null,
    pageUrl,
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

/** Throws on network/HTTP failure; null means "no English Wikipedia article". */
async function fetchPersonSummary(qid: string): Promise<PersonSummary | null> {
  const { enwiki, description } = parseWikidata(await fetchJson<WikidataResponse>(wikidataUrl(qid)), qid)
  if (!enwiki) return null
  return parseSummary(await fetchJson<SummaryResponse>(summaryUrl(enwiki)), description)
}

const cache = new Map<string, Promise<PersonSummary | null>>()

/** Successes and "no article" are cached per qid; network/HTTP failures resolve null but are retried on the next call. Never rejects. */
export function loadPersonSummary(qid: string): Promise<PersonSummary | null> {
  const hit = cache.get(qid)
  if (hit) return hit
  const attempt = fetchPersonSummary(qid)
  cache.set(qid, attempt)
  return attempt.catch(() => {
    if (cache.get(qid) === attempt) cache.delete(qid)
    return null
  })
}

/** For tests. */
export function resetPersonSummaryCache(): void {
  cache.clear()
}

export interface KnownForShow {
  slug: string
  title: string
  year: string | null
}

/** Catalogue shows listing this person as a creator, earliest year first (unknown years last), at most `limit`. */
export function knownFor(entries: SearchableEntry[], name: string, limit = 3): KnownForShow[] {
  return entries
    .filter(e => e.creators.includes(name))
    .sort((a, b) => (a.year ?? '9999').localeCompare(b.year ?? '9999') || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ slug, title, year }) => ({ slug, title, year }))
}
