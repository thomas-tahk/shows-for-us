import type { CastCredit } from '../../data/writeup'
import Section from './Section'

export default function OriginalCast({ cast }: { cast: CastCredit[] }) {
  if (cast.length === 0) return null
  return (
    <Section id="cast-h" title="Original cast">
      <ul className="grid gap-x-8 gap-y-3 text-neutral-100 sm:grid-cols-2">
        {cast.map(c => (
          <li key={`${c.person}-${c.role}`} className="break-words">
            <span className="block font-semibold text-white">{c.person}</span><span className="text-neutral-200">{c.role}</span>
            {c.production && <span className="text-neutral-300"> ({c.production})</span>}
          </li>
        ))}
      </ul>
    </Section>
  )
}
