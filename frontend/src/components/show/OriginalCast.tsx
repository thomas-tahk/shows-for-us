import type { CastCredit } from '../../data/writeup'
import Section from './Section'

export default function OriginalCast({ cast }: { cast: CastCredit[] }) {
  if (cast.length === 0) return null
  return (
    <Section id="cast-h" title="Original cast">
      <ul className="space-y-1 text-neutral-200">
        {cast.map(c => (
          <li key={`${c.person}-${c.role}`} className="break-words">
            <span className="font-semibold">{c.person}</span> &mdash; {c.role}
            {c.production && <span className="text-neutral-400"> ({c.production})</span>}
          </li>
        ))}
      </ul>
    </Section>
  )
}
