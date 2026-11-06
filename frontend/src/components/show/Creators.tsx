import { matchCredit } from '../../data/matchCredit'
import type { PersonCredit } from '../../data/show'
import type { Creator } from '../../data/writeup'
import PersonHoverCard from '../PersonHoverCard'
import Section from './Section'

function CreatorName({ name, known }: { name: string; known: PersonCredit[] }) {
  const match = matchCredit(name, known)
  if (!match) return <span className="text-lg font-semibold">{name}</span>
  return <PersonHoverCard name={name} qid={match.qid} href={match.ibdb_url} className="text-lg" />
}

/** Write-ups name creators without a Wikidata id: only an exact name match in the show's data gets a hover card. */
export default function Creators({ creators, known = [] }: { creators: Creator[]; known?: PersonCredit[] }) {
  if (creators.length === 0) return null
  return (
    <Section id="creators-h" title="Created by">
      <ul className="space-y-3 text-neutral-100">
        {creators.map(c => (
          <li key={`${c.name}-${c.role}`} className="break-words">
            <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-300">{c.role}</span>
            <CreatorName name={c.name} known={known} />
          </li>
        ))}
      </ul>
    </Section>
  )
}
