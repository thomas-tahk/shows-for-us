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
      <ul className="divide-y divide-neutral-800 text-neutral-100">
        {productions.map(p => (
          <li key={`${p.name}-${p.venue}`} className="break-words py-3 first:pt-0 last:pb-0">
            <span className="font-semibold">{p.name}</span>: {p.venue}, {p.city}
            {span(p) && <span className="text-neutral-300"> ({span(p)})</span>}
            {p.note && <span className="block text-sm text-neutral-300">{p.note}</span>}
          </li>
        ))}
      </ul>
    </Section>
  )
}
