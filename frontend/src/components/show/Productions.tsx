import type { Production } from '../../data/writeup'
import Section from './Section'

function span(p: Production): string {
  if (p.opened && p.closed) return `${p.opened} to ${p.closed}`
  if (p.opened) return `opened ${p.opened}`
  return ''
}

export default function Productions({ productions }: { productions: Production[] }) {
  if (productions.length === 0) return null
  return (
    <Section id="productions-h" title="Notable productions">
      <ul className="space-y-2 text-neutral-200">
        {productions.map(p => (
          <li key={`${p.name}-${p.venue}`} className="break-words">
            <span className="font-semibold">{p.name}</span>: {p.venue}, {p.city}
            {span(p) && <span className="text-neutral-400"> ({span(p)})</span>}
            {p.note && <span className="block text-sm text-neutral-400">{p.note}</span>}
          </li>
        ))}
      </ul>
    </Section>
  )
}
