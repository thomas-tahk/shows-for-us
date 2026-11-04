// Musical or not? Wikidata types operas, ballets and masques as Q58483083 just like musicals,
// and its genre data is patchy both ways, so the first words of the Wikipedia intro decide
// first and the Wikidata class check (excludedByClass) is the fallback.
export type Decision = 'text-keep' | 'text-drop' | 'class-keep' | 'class-drop'

const TEXT_WINDOW = 250
const SOFT_OPERA = /\b(rock|folk|pop)[ -]operas?\b/gi
/** Non-musical stage forms, optional plural. Shared with the summary-sanity metric in catalog-lib.ts. */
export const FORM_WORDS = /\b(opera|opéra|operetta|opérette|ballet|oratorio|cantata|masque|zarzuela|singspiel)s?\b/i
/** "musical", or "play with music" (e.g. The Threepenny Opera). Shared likewise. */
export const MUSICAL_WORDS = /\b(musical|play with music)\b/i

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Removes the show's own title (minus a "(disambiguation)" suffix) so "The Threepenny Opera" doesn't read as an opera. */
function withoutTitle(head: string, title: string | undefined): string {
  const bare = (title ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim()
  return bare ? head.replace(new RegExp(escapeRegex(bare), 'gi'), ' ') : head
}

/** text-keep: says "musical", names no other form. text-drop: the reverse. Otherwise the class decides. */
export function classifyShow(summary: string | undefined, excludedByClass: boolean, title?: string): Decision {
  const window = (summary ?? '').slice(0, TEXT_WINDOW)
  const head = withoutTitle(window, title).replace(SOFT_OPERA, 'musical')
  const musical = MUSICAL_WORDS.test(head)
  const other = FORM_WORDS.test(head)
  if (musical && !other) return 'text-keep'
  if (other && !musical) return 'text-drop'
  return excludedByClass ? 'class-drop' : 'class-keep'
}

interface Candidate {
  enwiki: string
  excludedByClass?: boolean
}

export interface Classified<T> {
  kept: T[]
  counts: Record<Decision, number>
  /** enwiki titles where the text overrode the class. */
  keptOverClass: string[]
  droppedOverClass: string[]
}

export function classifyEntries<T extends Candidate>(entries: T[], extracts: Map<string, string>): Classified<T> {
  const out: Classified<T> = { kept: [], counts: { 'text-keep': 0, 'text-drop': 0, 'class-keep': 0, 'class-drop': 0 }, keptOverClass: [], droppedOverClass: [] }
  for (const e of entries) {
    const excluded = e.excludedByClass ?? false
    const d = classifyShow(extracts.get(e.enwiki), excluded, e.enwiki)
    out.counts[d]++
    if (d.endsWith('keep')) out.kept.push(e)
    if (d === 'text-keep' && excluded) out.keptOverClass.push(e.enwiki)
    if (d === 'text-drop' && !excluded) out.droppedOverClass.push(e.enwiki)
  }
  return out
}

const EXAMPLES = 10

export function logDecisions(c: Classified<unknown>, log: (msg: string) => void): void {
  for (const [d, n] of Object.entries(c.counts)) log(`decision ${d}: ${n}`)
  log(`text-keep overriding class (${c.keptOverClass.length}), first ${EXAMPLES}: ${c.keptOverClass.slice(0, EXAMPLES).join('; ')}`)
  log(`text-drop overriding class (${c.droppedOverClass.length}), first ${EXAMPLES}: ${c.droppedOverClass.slice(0, EXAMPLES).join('; ')}`)
}
