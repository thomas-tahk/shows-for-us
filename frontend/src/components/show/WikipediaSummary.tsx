import type { ShowSummary } from '../../data/show'
import Section from './Section'
import SummaryText from './SummaryText'

const link = 'text-amber-400 underline hover:no-underline'

export default function WikipediaSummary({ summary }: { summary: ShowSummary }) {
  return (
    <Section id="summary-h" title="From Wikipedia">
      <div className="max-w-prose text-lg">
        <SummaryText text={summary.text} />
      </div>
      <p className="mt-4 text-xs text-neutral-300">
        Text from <a className={link} href={summary.source_url}>this Wikipedia article</a>,{' '}
        <a className={link} href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, unmodified.
      </p>
    </Section>
  )
}
