import type { Award } from '../../data/writeup'
import Section from './Section'

export default function Awards({ awards }: { awards: Award[] }) {
  if (awards.length === 0) return null
  return (
    <Section id="awards-h" title="Awards">
      <ul className="space-y-1 text-neutral-200">
        {awards.map(a => (
          <li key={`${a.name}-${a.year}`} className="break-words">
            {a.name} <span className="text-neutral-400">({a.year})</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}
