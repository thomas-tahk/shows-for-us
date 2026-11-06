import type { PersonCredit } from './show'

/** The credit whose name equals `name` (case-insensitive), so a write-up creator can borrow its Wikidata id. */
export function matchCredit(name: string, known: PersonCredit[]): PersonCredit | undefined {
  const wanted = name.trim().toLowerCase()
  return known.find(p => p.name.trim().toLowerCase() === wanted)
}
