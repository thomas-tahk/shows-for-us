// Catalogue pull: every musical (Wikidata class Q58483083 incl. subclasses) with an English
// Wikipedia article, minus the flagships. Three sequential stages, all via the injected Fetcher:
//   1. listing   SPARQL, paged LIMIT/OFFSET   -> (Q-id, enwiki title)
//   2. details   SPARQL, VALUES batches       -> credits, premiere, awards, links
//   3. extracts  MediaWiki action API batches -> intro text (CC BY-SA 4.0)
import type { CatalogIndexEntry, CatalogShard, CatalogShow } from '../src/data/catalogShow.ts'
import { shardOf } from '../src/data/catalogShow.ts'
import type { Flagship, ShowAward, ShowSummary } from '../src/data/show.ts'
import {
  MUSICAL_CLASS,
  cmp,
  dedupe,
  formatDate,
  itemsQuery,
  parseRows,
  people,
  qidOf,
  type Fetcher,
  type PullRequest,
  type Row,
} from './pull-lib.ts'

export const LIST_PAGE_SIZE = 2000
export const ITEMS_BATCH = 100
export const EXTRACTS_BATCH = 20
const MAX_CREATORS = 3

export interface ListEntry {
  qid: string
  enwiki: string
}
interface PullOptions {
  listPageSize?: number
  log?: (msg: string) => void
}

// ---- Slugs -------------------------------------------------------------------

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "Chicago (musical)" -> "Chicago". */
export const displayTitle = (enwiki: string) => enwiki.replace(/\s*\([^()]*\)\s*$/, '').trim() || enwiki

const countBy = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())

/**
 * Slug per Q-id, independent of input order. Base slug = title minus trailing parenthetical.
 * A base shared with another show or a flagship falls back to the full-title slug; a full
 * slug that still collides gets the lowercase Q-id appended.
 */
export function assignSlugs(entries: ListEntry[], flagshipSlugs: Set<string>): Map<string, string> {
  const base = (e: ListEntry) => slugify(displayTitle(e.enwiki)) || e.qid.toLowerCase()
  const counts = countBy(entries.map(base))
  const contested = (e: ListEntry) => flagshipSlugs.has(base(e)) || (counts.get(base(e)) ?? 0) > 1
  const taken = new Set([...flagshipSlugs, ...entries.filter((e) => !contested(e)).map(base)])
  const full = (e: ListEntry) => slugify(e.enwiki) || e.qid.toLowerCase()
  const fullCounts = countBy(entries.filter(contested).map(full))

  const slugs = new Map<string, string>()
  for (const e of entries) {
    if (!contested(e)) slugs.set(e.qid, base(e))
    else if (taken.has(full(e)) || (fullCounts.get(full(e)) ?? 0) > 1) slugs.set(e.qid, `${full(e)}-${e.qid.toLowerCase()}`)
    else slugs.set(e.qid, full(e))
  }
  return slugs
}

// ---- Requests ----------------------------------------------------------------

const SPARQL = 'https://query.wikidata.org/sparql'
const pad = (n: number) => String(n).padStart(3, '0')

export function listingQuery(offset: number, limit: number): string {
  return `SELECT ?item ?enwiki WHERE {
  ?item wdt:P31/wdt:P279* wd:${MUSICAL_CLASS} .
  ?article schema:about ?item ;
           schema:isPartOf <https://en.wikipedia.org/> ;
           schema:name ?enwiki .
}
ORDER BY ?item
LIMIT ${limit} OFFSET ${offset}`
}

function sparqlRequest(path: string, query: string): PullRequest {
  return { path, url: `${SPARQL}?format=json&query=${encodeURIComponent(query)}`, accept: 'application/sparql-results+json' }
}

export function extractsRequest(titles: string[], batch: number, part: number, cont: Record<string, unknown> = {}): PullRequest {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    exintro: '1',
    explaintext: '1',
    exlimit: 'max',
    redirects: '1',
    format: 'json',
    formatversion: '2',
    titles: titles.join('|'),
  })
  for (const [k, v] of Object.entries(cont)) params.set(k, String(v))
  return { path: `catalog/extracts.${pad(batch)}.${part}.json`, url: `https://en.wikipedia.org/w/api.php?${params}`, accept: 'application/json' }
}

const chunk = <T>(xs: T[], n: number): T[][] => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, (i + 1) * n))

export const wikipediaUrl = (enwiki: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(enwiki.replace(/ /g, '_'))}`

// ---- Stage 1: listing --------------------------------------------------------

type Bindings = { results: { bindings: Record<string, { value: string } | undefined>[] } }

export async function fetchListing(fetcher: Fetcher, pageSize = LIST_PAGE_SIZE): Promise<ListEntry[]> {
  const byQid = new Map<string, ListEntry>()
  for (let page = 0; ; page++) {
    const q = listingQuery(page * pageSize, pageSize)
    const { results } = (await fetcher(sparqlRequest(`catalog/list.${pad(page)}.json`, q))) as Bindings
    for (const b of results.bindings) {
      if (b.item && b.enwiki) byQid.set(qidOf(b.item.value), { qid: qidOf(b.item.value), enwiki: b.enwiki.value })
    }
    if (results.bindings.length < pageSize) break
  }
  return [...byQid.values()].sort((a, b) => Number(a.qid.slice(1)) - Number(b.qid.slice(1)))
}

export function withoutFlagships(entries: ListEntry[], flagships: Flagship[]): ListEntry[] {
  const qids = new Set(flagships.flatMap((f) => f.qids ?? []))
  const titles = new Set(flagships.map((f) => f.enwiki))
  return entries.filter((e) => !qids.has(e.qid) && !titles.has(e.enwiki))
}

// ---- Stage 2: details --------------------------------------------------------

async function fetchRows(fetcher: Fetcher, entries: ListEntry[]): Promise<Map<string, Row[]>> {
  const byItem = new Map<string, Row[]>()
  const batches = chunk(entries.map((e) => e.qid), ITEMS_BATCH)
  for (const [i, qids] of batches.entries()) {
    const res = await fetcher(sparqlRequest(`catalog/items.${pad(i)}.json`, itemsQuery(qids, false)))
    for (const r of parseRows(res)) byItem.set(r.item, [...(byItem.get(r.item) ?? []), r])
  }
  return byItem
}

/** The label service returns the Q-id itself when there is no English label. */
const hasEnglishLabel = (r: Row) => !!r.label && r.label !== qidOf(r.v.value)

const ofKind = (rows: Row[], kind: string) => rows.filter((r) => r.kind === kind)

// ---- Stage 3: extracts -------------------------------------------------------

interface ExtractsResponse {
  continue?: Record<string, unknown>
  query?: {
    normalized?: { from: string; to: string }[]
    redirects?: { from: string; to: string }[]
    pages?: { title: string; extract?: string }[]
  }
}

async function fetchBatchExtracts(fetcher: Fetcher, titles: string[], batch: number): Promise<Map<string, string>> {
  const moved = new Map<string, string>()
  const text = new Map<string, string>()
  let cont: Record<string, unknown> | undefined = {}
  for (let part = 0; cont; part++) {
    const res = (await fetcher(extractsRequest(titles, batch, part, cont))) as ExtractsResponse
    for (const m of [...(res.query?.normalized ?? []), ...(res.query?.redirects ?? [])]) moved.set(m.from, m.to)
    for (const p of res.query?.pages ?? []) if (p.extract && !text.has(p.title)) text.set(p.title, p.extract)
    cont = res.continue
  }
  const resolve = (t: string) => {
    const n = moved.get(t) ?? t
    return moved.get(n) ?? n
  }
  return new Map(titles.flatMap((t) => (text.has(resolve(t)) ? [[t, text.get(resolve(t)) as string] as const] : [])))
}

async function fetchExtracts(fetcher: Fetcher, entries: ListEntry[]): Promise<Map<string, string>> {
  const all = new Map<string, string>()
  for (const [i, batch] of chunk(entries.map((e) => e.enwiki), EXTRACTS_BATCH).entries()) {
    for (const [t, x] of await fetchBatchExtracts(fetcher, batch, i)) all.set(t, x)
  }
  return all
}

// ---- Assembly ----------------------------------------------------------------

function summaryOf(enwiki: string, extract: string | undefined): ShowSummary | null {
  const text = extract?.trim()
  return text ? { text, source_url: wikipediaUrl(enwiki), license: 'CC BY-SA 4.0', modified: false } : null
}

function linksOf(entry: ListEntry, rows: Row[]): CatalogShow['links'] {
  const first = (k: string) => ofKind(rows, k)[0]?.v.value
  const ibdb = first('ibdb')
  const playbill = first('playbill')
  const site = first('website')
  return {
    ...(ibdb ? { ibdb: `https://www.ibdb.com/broadway-show/${encodeURIComponent(ibdb)}` } : {}),
    ...(playbill ? { playbill: `https://playbill.com/production/${encodeURIComponent(playbill)}` } : {}),
    ...(site ? { official_site: site } : {}),
    wikipedia: wikipediaUrl(entry.enwiki),
    wikidata: `https://www.wikidata.org/wiki/${entry.qid}`,
  }
}

function awardsOf(rows: Row[]): ShowAward[] {
  return dedupe(ofKind(rows, 'award').filter(hasEnglishLabel)).map((r) => ({ name: r.label as string, qid: qidOf(r.v.value) }))
}

function premiereOf(rows: Row[]): CatalogShow['premiere'] {
  const earliest = ofKind(rows, 'premiere_date')[0] // rows are sorted by value, so first = earliest
  const venue = ofKind(rows, 'premiere_venue').find(hasEnglishLabel)
  return { date: earliest ? formatDate(earliest.v.value, earliest.extra) : null, venue: venue?.label ?? null }
}

export function buildCatalogShow(entry: ListEntry, slug: string, rows: Row[], extract: string | undefined): CatalogShow {
  const credits = (kind: string) => people(dedupe(ofKind(rows, kind).filter(hasEnglishLabel)))
  return {
    slug,
    title: displayTitle(entry.enwiki),
    qid: entry.qid,
    enwiki: entry.enwiki,
    composers: credits('composer'),
    lyricists: credits('lyricist'),
    librettists: credits('librettist'),
    premiere: premiereOf(rows),
    awards: awardsOf(rows),
    links: linksOf(entry, rows),
    summary: summaryOf(entry.enwiki, extract),
  }
}

export async function pullCatalog(flagships: Flagship[], fetcher: Fetcher, opts: PullOptions = {}): Promise<CatalogShow[]> {
  const log = opts.log ?? (() => {})
  const listed = await fetchListing(fetcher, opts.listPageSize)
  const entries = withoutFlagships(listed, flagships)
  log(`listing: ${listed.length} musicals with an enwiki article, ${entries.length} after excluding flagships`)
  const slugs = assignSlugs(entries, new Set(flagships.map((f) => f.slug)))
  const rows = await fetchRows(fetcher, entries)
  log(`details: ${rows.size} items with data`)
  const extracts = await fetchExtracts(fetcher, entries)
  log(`extracts: ${extracts.size} summaries`)
  return entries
    .map((e) => buildCatalogShow(e, slugs.get(e.qid) as string, rows.get(e.qid) ?? [], extracts.get(e.enwiki)))
    .sort((a, b) => cmp(a.slug, b.slug))
}

// ---- Output shapes -----------------------------------------------------------

export function buildIndex(shows: CatalogShow[]): CatalogIndexEntry[] {
  return shows
    .map((s) => ({
      slug: s.slug,
      title: s.title,
      year: s.premiere.date?.slice(0, 4) ?? null,
      creators: [...new Set([...s.composers, ...s.lyricists, ...s.librettists].map((p) => p.name))].slice(0, MAX_CREATORS),
    }))
    .sort((a, b) => cmp(a.title, b.title) || cmp(a.slug, b.slug))
}

export function groupShards(shows: CatalogShow[]): Map<string, CatalogShard> {
  const shards = new Map<string, CatalogShard>()
  for (const s of [...shows].sort((a, b) => cmp(a.slug, b.slug))) {
    const key = shardOf(s.slug)
    const shard = shards.get(key) ?? { shows: {} }
    shard.shows[s.slug] = s
    shards.set(key, shard)
  }
  return shards
}
