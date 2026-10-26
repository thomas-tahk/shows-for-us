import type { Flagship, PersonCredit, Show, ShowAward, ShowImage, ShowLinks, ShowSummary } from '../src/data/show.ts'

export const USER_AGENT = 'shows-for-us/0.1 (https://github.com/thomas-tahk/shows-for-us; bot)'
export const MUSICAL_CLASS = 'Q58483083'

/** One request the pull makes. `path` is its fixture path under fixtures/. */
export interface PullRequest {
  path: string
  url: string
  accept: string
}
export type Fetcher = (req: PullRequest) => Promise<unknown>

export class FixtureMissing extends Error {
  readonly path: string
  constructor(path: string) {
    super(`fixture missing: ${path}`)
    this.path = path
  }
}

// ---- SPARQL result types ----------------------------------------------------

interface Term {
  type: string
  value: string
}
type Binding = Record<string, Term | undefined>
interface SparqlResult {
  results: { bindings: Binding[] }
}

const SPARQL = 'https://query.wikidata.org/sparql'

function sparqlRequest(path: string, query: string): PullRequest {
  return {
    path,
    url: `${SPARQL}?format=json&query=${encodeURIComponent(query)}`,
    accept: 'application/sparql-results+json',
  }
}

export function resolveQuery(enwiki: string): string {
  const title = enwiki.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `SELECT ?item WHERE {
  ?article schema:about ?item ;
           schema:isPartOf <https://en.wikipedia.org/> ;
           schema:name "${title}"@en .
  ?item wdt:P31/wdt:P279* wd:${MUSICAL_CLASS} .
}`
}

export function itemsQuery(qids: string[]): string {
  const values = qids.map((q) => `wd:${q}`).join(' ')
  const person = (prop: string, kind: string) =>
    `{ ?item wdt:${prop} ?v . BIND("${kind}" AS ?kind) OPTIONAL { ?v wdt:P1220 ?extra } }`
  const plain = (prop: string, kind: string) => `{ ?item wdt:${prop} ?v . BIND("${kind}" AS ?kind) }`
  return `SELECT ?item ?kind ?v ?vLabel ?extra WHERE {
  VALUES ?item { ${values} }
  ${person('P86', 'composer')}
  UNION ${person('P676', 'lyricist')}
  UNION ${person('P87', 'librettist')}
  UNION ${plain('P1191', 'premiere_date')}
  UNION ${plain('P4647', 'premiere_venue')}
  UNION ${plain('P166', 'award')}
  UNION ${plain('P18', 'image')}
  UNION ${plain('P1219', 'ibdb')}
  UNION ${plain('P5833', 'playbill')}
  UNION ${plain('P856', 'website')}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`
}

// ---- Pure transforms --------------------------------------------------------

const qidOf = (uri: string) => uri.slice(uri.lastIndexOf('/') + 1)

export function parseResolve(res: unknown): string[] {
  const rows = (res as SparqlResult).results.bindings
  return [...new Set(rows.flatMap((b) => (b.item ? [qidOf(b.item.value)] : [])))]
}

interface Row {
  item: string
  kind: string
  v: Term
  label: string | undefined
  extra: string | undefined
}

function parseRows(res: unknown): Row[] {
  return (res as SparqlResult).results.bindings.flatMap((b) =>
    b.item && b.kind && b.v
      ? [{ item: qidOf(b.item.value), kind: b.kind.value, v: b.v, label: b.vLabel?.value, extra: b.extra?.value }]
      : [],
  )
}

function dedupe(rows: Row[]): Row[] {
  const seen = new Set<string>()
  return rows.filter((r) => {
    if (seen.has(r.v.value)) return false
    seen.add(r.v.value)
    return true
  })
}

/**
 * Rows of one kind across merged items. Values from the preferred (English
 * version) item win if it has any; otherwise fall back to the other items.
 */
function pick(rows: Row[], kind: string, qids: string[], prefer: string | undefined): Row[] {
  const ofKind = rows.filter((r) => r.kind === kind)
  const order = prefer ? [prefer, ...qids.filter((q) => q !== prefer)] : qids
  for (const q of order) {
    const own = ofKind.filter((r) => r.item === q)
    if (own.length) return dedupe(own)
  }
  return []
}

function people(rows: Row[]): PersonCredit[] {
  return rows.map((r) => ({
    name: r.label ?? qidOf(r.v.value),
    qid: qidOf(r.v.value),
    ...(r.extra ? { ibdb_url: `https://www.ibdb.com/broadway-cast-staff/${encodeURIComponent(r.extra)}` } : {}),
  }))
}

export function commonsFileName(uri: string): string {
  return decodeURIComponent(uri.slice(uri.lastIndexOf('/') + 1)).replace(/_/g, ' ')
}

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

interface ImageInfoPage {
  imageinfo?: {
    url: string
    descriptionurl: string
    extmetadata?: Record<string, { value: string } | undefined>
  }[]
}

export function parseImage(file: string, res: unknown): ShowImage | null {
  const page = (res as { query?: { pages?: ImageInfoPage[] } }).query?.pages?.[0]
  const info = page?.imageinfo?.[0]
  if (!info) return null
  const meta = info.extmetadata ?? {}
  return {
    commons_file: file,
    url: info.url,
    license: meta.LicenseShortName?.value ?? 'unknown',
    author: stripHtml(meta.Artist?.value ?? '') || 'unknown',
    source_url: info.descriptionurl,
  }
}

export function parseSummary(res: unknown): ShowSummary | null {
  const s = res as { extract?: string; content_urls?: { desktop?: { page?: string } } }
  const url = s.content_urls?.desktop?.page
  if (!s.extract || !url) return null
  return { text: s.extract, source_url: url, license: 'CC BY-SA 4.0', modified: false }
}

function buildShow(
  flagship: Flagship,
  qids: string[],
  rows: Row[],
  image: ShowImage | null,
  summary: ShowSummary | null,
): Show {
  const p = (k: string) => pick(rows, k, qids, flagship.prefer_qid)
  const first = (k: string) => p(k)[0]
  const date = first('premiere_date')?.v.value
  const links: ShowLinks = {}
  const ibdb = first('ibdb')?.v.value
  const playbill = first('playbill')?.v.value
  const site = first('website')?.v.value
  if (ibdb) links.ibdb = `https://www.ibdb.com/broadway-production/${encodeURIComponent(ibdb)}`
  if (playbill) links.playbill = `https://playbill.com/production/${encodeURIComponent(playbill)}`
  if (site) links.official_site = site
  const awards: ShowAward[] = [
    ...new Map(
      rows
        .filter((r) => r.kind === 'award')
        .map((r) => [r.v.value, { name: r.label ?? qidOf(r.v.value), qid: qidOf(r.v.value) }]),
    ).values(),
  ]
  return {
    slug: flagship.slug,
    title: flagship.title,
    qids,
    composers: people(p('composer')),
    lyricists: people(p('lyricist')),
    librettists: people(p('librettist')),
    premiere: {
      date: date ? date.slice(0, 10) : null,
      venue: first('premiere_venue')?.label ?? null,
    },
    awards,
    image,
    links,
    summary,
    wikidata_url: `https://www.wikidata.org/wiki/${flagship.prefer_qid ?? qids[0]}`,
  }
}

// ---- Orchestration ----------------------------------------------------------

export interface PullResult {
  shows: Show[]
  skipped: { slug: string; reason: string }[]
}

/** Sequential on purpose (API etiquette). A show whose Wikidata fixture is missing is skipped, not fatal. */
export async function pullShows(
  flagships: Flagship[],
  fetcher: Fetcher,
  log: (msg: string) => void = () => {},
): Promise<PullResult> {
  const shows: Show[] = []
  const skipped: PullResult['skipped'] = []

  for (const f of flagships) {
    try {
      let qids = f.qids
      if (!qids?.length) {
        qids = parseResolve(await fetcher(sparqlRequest(`wikidata/${f.slug}.resolve.json`, resolveQuery(f.enwiki))))
        if (!qids.length) throw new Error(`no musical item found for enwiki "${f.enwiki}"`)
      }
      const rows = parseRows(await fetcher(sparqlRequest(`wikidata/${f.slug}.json`, itemsQuery(qids))))

      // Image and summary are optional: a missing fixture leaves the field null.
      let image: ShowImage | null = null
      const imgRow = pick(rows, 'image', qids, f.prefer_qid)[0]
      if (imgRow) {
        const file = commonsFileName(imgRow.v.value)
        const url =
          'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url%7Cextmetadata&format=json&formatversion=2&titles=' +
          encodeURIComponent(`File:${file}`)
        try {
          image = parseImage(
            file,
            await fetcher({ path: `commons/${f.slug}.imageinfo.json`, url, accept: 'application/json' }),
          )
        } catch (e) {
          if (!(e instanceof FixtureMissing)) throw e
          log(`${f.slug}: no image fixture, image left null`)
        }
      }
      let summary: ShowSummary | null = null
      try {
        summary = parseSummary(
          await fetcher({
            path: `wikipedia/${f.slug}.summary.json`,
            url: `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(f.enwiki.replace(/ /g, '_'))}`,
            accept: 'application/json',
          }),
        )
      } catch (e) {
        if (!(e instanceof FixtureMissing)) throw e
        log(`${f.slug}: no summary fixture, summary left null`)
      }

      shows.push(buildShow(f, qids, rows, image, summary))
      log(`${f.slug}: ok`)
    } catch (e) {
      const reason = e instanceof FixtureMissing ? `skipped (${e.message})` : `FAILED: ${(e as Error).message}`
      skipped.push({ slug: f.slug, reason })
    }
  }
  return { shows, skipped }
}
