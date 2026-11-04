// M2 data contract: the catalogue of every musical with an English Wikipedia
// article, written by `npm run pull:catalog` and read by the site at runtime.
// Too big for the JS bundle, so it lives in public/ and is fetched:
//   /catalog/index.json          CatalogIndex  (search; every catalogue show)
//   /catalog/shows/<shard>.json  CatalogShard  (full records, grouped by shardOf(slug))
// Flagship shows are NOT in the catalogue; they keep their own pages and data.
import type { PersonCredit, ShowAward, ShowSummary } from './show'

export interface CatalogLinks {
  /** https://www.ibdb.com/broadway-show/<P1219> */
  ibdb?: string
  /** https://playbill.com/production/<P5833> */
  playbill?: string
  /** Wikidata P856 */
  official_site?: string
  /** The English Wikipedia article. Always present. */
  wikipedia: string
  /** https://www.wikidata.org/wiki/<qid>. Always present. */
  wikidata: string
}

export interface CatalogShow {
  slug: string
  /** Display title: the enwiki title minus a trailing "(musical)"-style disambiguator. */
  title: string
  qid: string
  /** English Wikipedia article title. */
  enwiki: string
  composers: PersonCredit[]
  lyricists: PersonCredit[]
  librettists: PersonCredit[]
  /** Earliest first-performance date, as precise as Wikidata ("1985" | "1985-09" | "1985-09-28"). */
  premiere: { date: string | null; venue: string | null }
  awards: ShowAward[]
  links: CatalogLinks
  /** Intro of the Wikipedia article (plain text, CC BY-SA 4.0), or null. */
  summary: ShowSummary | null
}

export interface CatalogIndexEntry {
  slug: string
  title: string
  /** Premiere year, e.g. "1927", or null. */
  year: string | null
  /** Up to 3 creator names (composers, lyricists, librettists, de-duplicated). */
  creators: string[]
}

export interface CatalogMeta {
  generated_at: string
  mode: 'live' | 'recorded-live' | 'offline-fixtures'
  /** False while built from fixtures: pages must say the data is sample data. */
  live: boolean
  count: number
}

export interface CatalogIndex {
  meta: CatalogMeta
  shows: CatalogIndexEntry[]
}

export interface CatalogShard {
  /** Same as the index's meta.live, so a show page never needs the 1 MB index. */
  live: boolean
  shows: Record<string, CatalogShow>
}

export const SHARD_COUNT = 128

/** FNV-1a over the slug, mod SHARD_COUNT, zero-padded to 3 digits ("000".."127"). */
export function shardOf(slug: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return String(h % SHARD_COUNT).padStart(3, '0')
}

export const CATALOG_INDEX_URL = '/catalog/index.json'
export const shardUrl = (slug: string) => `/catalog/shows/${shardOf(slug)}.json`
