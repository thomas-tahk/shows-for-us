import { normalize } from './catalog'

export interface SearchableEntry {
  slug: string
  title: string
  year: string | null
  creators: string[]
  /** Flagships rank above every catalogue show and are what an empty query lists. */
  flagship?: boolean
}

export interface SearchResult {
  results: SearchableEntry[]
  /** Number of matches before the cap. */
  total: number
}

interface Prepared {
  entry: SearchableEntry
  sortKey: string
  titleTokens: string[]
  allTokens: string[]
}

const TYPO_MIN_LENGTH = 5
const LEADING_ARTICLES = new Set(['the', 'a', 'an'])
const tokenize = (s: string) => normalize(s).split(' ').filter(Boolean)

/** True when a and b differ by at most one insertion, deletion, substitution or adjacent swap. */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  if (i === a.length && i === b.length) return true
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)
  }
  const [long, short] = a.length > b.length ? [a, b] : [b, a]
  return long.slice(i + 1) === short.slice(i)
}

/** A query word matches a token as a prefix; words of 5+ letters also tolerate one typo. */
function wordMatchesToken(word: string, token: string): boolean {
  if (token.startsWith(word)) return true
  if (word.length < TYPO_MIN_LENGTH) return false
  for (let k = word.length - 1; k <= word.length + 1; k++) {
    if (withinOneEdit(word, token.slice(0, k))) return true
  }
  return false
}

const wordMatchesAny = (word: string, tokens: string[]) => tokens.some(t => wordMatchesToken(word, t))

function prepare(entry: SearchableEntry): Prepared {
  const titleTokens = tokenize(entry.title)
  const rest = [...entry.creators.flatMap(tokenize), ...(entry.year ? tokenize(entry.year) : [])]
  return { entry, sortKey: normalize(entry.title), titleTokens, allTokens: [...titleTokens, ...rest] }
}

const prepared = new WeakMap<SearchableEntry[], Prepared[]>()
function preparedFor(entries: SearchableEntry[]): Prepared[] {
  let p = prepared.get(entries)
  if (!p) {
    p = entries.map(prepare)
    prepared.set(entries, p)
  }
  return p
}

function isTitlePrefix(words: string[], titleTokens: string[]): boolean {
  const starts = LEADING_ARTICLES.has(titleTokens[0]) ? [0, 1] : [0]
  return starts.some(s => words.every((w, i) => titleTokens[s + i] !== undefined && wordMatchesToken(w, titleTokens[s + i])))
}

/** 0 title prefix, 1 other title match, 2 creator/year match, -1 no match. */
function tierOf(words: string[], p: Prepared): number {
  if (!words.every(w => wordMatchesAny(w, p.allTokens))) return -1
  if (!words.every(w => wordMatchesAny(w, p.titleTokens))) return 2
  return isTitlePrefix(words, p.titleTokens) ? 0 : 1
}

interface Ranked {
  p: Prepared
  rank: number
}

function byRank(a: Ranked, b: Ranked): number {
  if (a.rank !== b.rank) return a.rank - b.rank
  if (a.p.sortKey !== b.p.sortKey) return a.p.sortKey < b.p.sortKey ? -1 : 1
  return a.p.entry.slug < b.p.entry.slug ? -1 : a.p.entry.slug > b.p.entry.slug ? 1 : 0
}

/** Search `entries`; empty query lists the flagships in their given order. */
export function search(entries: SearchableEntry[], query: string, limit: number): SearchResult {
  const words = tokenize(query)
  if (words.length === 0) {
    const flagships = entries.filter(e => e.flagship)
    return { results: flagships.slice(0, limit), total: flagships.length }
  }
  const ranked: Ranked[] = []
  for (const p of preparedFor(entries)) {
    const tier = tierOf(words, p)
    if (tier >= 0) ranked.push({ p, rank: (p.entry.flagship ? 0 : 3) + tier })
  }
  ranked.sort(byRank)
  return { results: ranked.slice(0, limit).map(r => r.p.entry), total: ranked.length }
}
