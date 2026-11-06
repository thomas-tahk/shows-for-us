import type { Award } from '../../data/writeup'
import Section from './Section'
import AwardChips from './AwardChips'

export default function Awards({ awards }: { awards: Award[] }) {
  if (awards.length === 0) return null
  return (
    <Section id="awards-h" title="Awards">
      <AwardChips items={awards.map(a => ({ key: `${a.name}-${a.year}`, label: a.name, year: a.year }))} />
    </Section>
  )
}
