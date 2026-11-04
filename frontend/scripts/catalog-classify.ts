// Musical or not? Wikidata types operas, ballets and masques as Q58483083 just like musicals,
// and its genre data is patchy both ways, so the first words of the Wikipedia intro decide
// first and the Wikidata class check (excludedByClass) is the fallback.
export type Decision = 'text-keep' | 'text-drop' | 'class-keep' | 'class-drop'

const TEXT_WINDOW = 250
const SOFT_OPERA = /\b(rock|folk|pop) opera\b/g
const MUSICAL = /\bmusical\b/
const NOT_MUSICAL = /\b(operas?|opéra|operetta|opérette|ballet|oratorio|cantata|masque|zarzuela|singspiel)\b/

/** text-keep: says "musical", names no other form. text-drop: the reverse. Otherwise the class decides. */
export function classifyShow(summary: string | undefined, excludedByClass: boolean): Decision {
  const head = (summary ?? '').slice(0, TEXT_WINDOW).toLowerCase().replace(SOFT_OPERA, 'musical')
  const musical = MUSICAL.test(head)
  const other = NOT_MUSICAL.test(head)
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
    const d = classifyShow(extracts.get(e.enwiki), excluded)
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
