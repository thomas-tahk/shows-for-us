import type { Creator } from '../../data/writeup'
import Section from './Section'

export default function Creators({ creators }: { creators: Creator[] }) {
  if (creators.length === 0) return null
  return (
    <Section id="creators-h" title="Created by">
      <ul className="space-y-1 text-neutral-200">
        {creators.map(c => (
          <li key={`${c.name}-${c.role}`} className="break-words">
            <span className="font-semibold">{c.name}</span> <span className="text-neutral-400">({c.role})</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}
