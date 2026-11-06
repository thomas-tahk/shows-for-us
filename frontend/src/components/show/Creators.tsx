import type { Creator } from '../../data/writeup'
import Section from './Section'

// Flagship write-ups name creators without a Wikidata id, so they cannot have a hover card (see PersonHoverCard).
export default function Creators({ creators }: { creators: Creator[] }) {
  if (creators.length === 0) return null
  return (
    <Section id="creators-h" title="Created by">
      <ul className="space-y-3 text-neutral-100">
        {creators.map(c => (
          <li key={`${c.name}-${c.role}`} className="break-words">
            <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-300">{c.role}</span>
            <span className="text-lg font-semibold">{c.name}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}
