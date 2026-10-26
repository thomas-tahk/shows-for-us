// Schema + validator for the curated write-ups in content/shows/<slug>.yaml.
// Every fact carries a `source` URL; a fact without one is rejected.

export type WriteupStatus = 'awaiting-owner-check' | 'owner-checked'

export interface HistoryParagraph {
  text: string
  source: string
}

export interface Creator {
  name: string
  /** e.g. "music and lyrics", "book". */
  role: string
  source: string
}

export interface CastCredit {
  person: string
  role: string
  /** Which production the credit is for, e.g. "Broadway 2015". */
  production?: string
  source: string
}

export interface Production {
  name: string
  venue: string
  city: string
  /** YYYY, YYYY-MM or YYYY-MM-DD. */
  opened?: string
  /** Same format as `opened`. */
  closed?: string
  note?: string
  source: string
}

export interface Award {
  name: string
  year: number
  source: string
}

export interface Run {
  name: string
  venue: string
  city: string
  start?: string
  end?: string
  ticket_url: string
  source: string
  /** YYYY-MM-DD the owner last checked the official site. */
  checked: string
}

export interface Tickets {
  official_url: string
  source: string
}

export interface Writeup {
  slug: string
  title: string
  status: WriteupStatus
  /** false = the cited URLs were not opened when drafting; the owner checks them. */
  sources_opened: boolean
  creators: Creator[]
  history: HistoryParagraph[]
  original_cast: CastCredit[]
  productions: Production[]
  awards: Award[]
  runs: Run[]
  tickets?: Tickets
}

export type WriteupResult = { ok: true; value: Writeup } | { ok: false; errors: string[] }

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const URL_RE = /^https?:\/\/[^\s/]+\.[^\s]+$/
/** Real calendar check for YYYY, YYYY-MM or YYYY-MM-DD (full = YYYY-MM-DD only). */
function validDate(v: string, full: boolean): boolean {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(v)
  if (!m || (full && m[3] === undefined)) return false
  const month = m[2] === undefined ? 1 : Number(m[2])
  if (month < 1 || month > 12) return false
  if (m[3] === undefined) return true
  const day = Number(m[3])
  return day >= 1 && day <= new Date(Date.UTC(Number(m[1]), month, 0)).getUTCDate()
}
const PARTIAL_HINT = 'YYYY, YYYY-MM or YYYY-MM-DD'

export function parseWriteup(input: unknown): WriteupResult {
  const errors: string[] = []

  const str = (o: Obj, key: string, path: string): string => {
    const v = o[key]
    if (typeof v !== 'string' || v.trim() === '') {
      errors.push(`${path}${key}: required non-empty string`)
      return ''
    }
    return v
  }
  const optStr = (o: Obj, key: string, path: string): string | undefined =>
    o[key] === undefined ? undefined : str(o, key, path)
  const url = (o: Obj, key: string, path: string): string => {
    const v = str(o, key, path)
    if (v !== '' && !URL_RE.test(v)) errors.push(`${path}${key}: must be an http(s) URL`)
    return v
  }
  const date = (o: Obj, key: string, path: string, full: boolean, optional: boolean) => {
    const v = optional ? optStr(o, key, path) : str(o, key, path)
    if (v !== undefined && v !== '' && !validDate(v, full)) {
      errors.push(`${path}${key}: must be a real date, ${full ? 'YYYY-MM-DD' : PARTIAL_HINT}`)
    }
    return v
  }
  const noExtra = (o: Obj, allowed: string[], path: string) => {
    for (const k of Object.keys(o)) if (!allowed.includes(k)) errors.push(`${path}${k}: unknown key`)
  }
  const list = <T>(o: Obj, key: string, allowed: string[], each: (item: Obj, path: string) => T): T[] => {
    const v = o[key]
    if (!Array.isArray(v)) {
      errors.push(`${key}: required array`)
      return []
    }
    return v.map((item, i) => {
      if (!isObj(item)) {
        errors.push(`${key}[${i}]: must be an object`)
        return {} as T
      }
      noExtra(item, allowed, `${key}[${i}].`)
      return each(item, `${key}[${i}].`)
    })
  }

  if (!isObj(input)) return { ok: false, errors: ['root: must be a mapping'] }
  const o = input

  noExtra(
    o,
    ['slug', 'title', 'status', 'sources_opened', 'creators', 'history', 'original_cast', 'productions', 'awards', 'runs', 'tickets'],
    '',
  )
  const slug = str(o, 'slug', '')
  const title = str(o, 'title', '')
  if (slug !== '' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.push('slug: must be lowercase-hyphenated')
  if (o.status !== 'awaiting-owner-check' && o.status !== 'owner-checked') {
    errors.push("status: must be 'awaiting-owner-check' or 'owner-checked'")
  }
  if (typeof o.sources_opened !== 'boolean') errors.push('sources_opened: required boolean')

  const creators = list<Creator>(o, 'creators', ['name', 'role', 'source'], (c, p) => ({
    name: str(c, 'name', p),
    role: str(c, 'role', p),
    source: url(c, 'source', p),
  }))
  const history = list<HistoryParagraph>(o, 'history', ['text', 'source'], (h, p) => ({
    text: str(h, 'text', p),
    source: url(h, 'source', p),
  }))
  if (Array.isArray(o.history) && (history.length < 2 || history.length > 4)) {
    errors.push('history: needs 2 to 4 paragraphs')
  }
  const original_cast = list<CastCredit>(o, 'original_cast', ['person', 'role', 'production', 'source'], (c, p) => ({
    person: str(c, 'person', p),
    role: str(c, 'role', p),
    production: optStr(c, 'production', p),
    source: url(c, 'source', p),
  }))
  const productions = list<Production>(o, 'productions', ['name', 'venue', 'city', 'opened', 'closed', 'note', 'source'], (x, p) => ({
    name: str(x, 'name', p),
    venue: str(x, 'venue', p),
    city: str(x, 'city', p),
    opened: date(x, 'opened', p, false, true),
    closed: date(x, 'closed', p, false, true),
    note: optStr(x, 'note', p),
    source: url(x, 'source', p),
  }))
  const awards = list<Award>(o, 'awards', ['name', 'year', 'source'], (a, p) => {
    if (!Number.isInteger(a.year)) errors.push(`${p}year: required integer`)
    return { name: str(a, 'name', p), year: a.year as number, source: url(a, 'source', p) }
  })
  const runs = list<Run>(o, 'runs', ['name', 'venue', 'city', 'start', 'end', 'ticket_url', 'source', 'checked'], (r, p) => ({
    name: str(r, 'name', p),
    venue: str(r, 'venue', p),
    city: str(r, 'city', p),
    start: date(r, 'start', p, false, true),
    end: date(r, 'end', p, false, true),
    ticket_url: url(r, 'ticket_url', p),
    source: url(r, 'source', p),
    checked: date(r, 'checked', p, true, false) ?? '',
  }))

  let tickets: Tickets | undefined
  if (o.tickets !== undefined) {
    if (!isObj(o.tickets)) errors.push('tickets: must be an object')
    else {
      noExtra(o.tickets, ['official_url', 'source'], 'tickets.')
      tickets = {
        official_url: url(o.tickets, 'official_url', 'tickets.'),
        source: url(o.tickets, 'source', 'tickets.'),
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return {
    ok: true,
    value: {
      slug,
      title,
      status: o.status as WriteupStatus,
      sources_opened: o.sources_opened as boolean,
      creators,
      history,
      original_cast,
      productions,
      awards,
      runs,
      ...(tickets ? { tickets } : {}),
    },
  }
}
