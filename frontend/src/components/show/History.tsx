import type { HistoryParagraph } from '../../data/writeup'
import Section from './Section'

export default function History({ paragraphs }: { paragraphs: HistoryParagraph[] }) {
  if (paragraphs.length === 0) return null
  return (
    <Section id="history-h" title="History">
      <div className="max-w-prose space-y-4 text-lg text-neutral-100 leading-relaxed">
        {paragraphs.map(p => (
          <p key={p.text}>{p.text}</p>
        ))}
      </div>
    </Section>
  )
}
