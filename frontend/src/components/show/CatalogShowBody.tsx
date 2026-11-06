import type { CatalogShow } from '../../data/catalogShow'
import { formatPremiereDate } from '../../data/catalogShard'
import PersonHoverCard from '../PersonHoverCard'
import AwardChips from './AwardChips'
import Section from './Section'
import ShowHero from './ShowHero'
import ShowLinks from './ShowLinks'
import WikipediaSummary from './WikipediaSummary'

function CreatedBy({ show }: { show: CatalogShow }) {
  const groups = [
    { role: 'Music', people: show.composers },
    { role: 'Lyrics', people: show.lyricists },
    { role: 'Book', people: show.librettists },
  ].filter(g => g.people.length > 0)
  if (groups.length === 0) return null
  return (
    <Section id="creators-h" title="Created by">
      <ul className="space-y-3 text-neutral-100">
        {groups.map(g => (
          <li key={g.role} className="break-words">
            <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-300">{g.role}</span>
            {g.people.map((p, i) => (
              <span key={p.qid}>
                {i > 0 && <span className="text-neutral-300">, </span>}
                <PersonHoverCard name={p.name} qid={p.qid} href={p.ibdb_url} className="text-lg" />
              </span>
            ))}
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Premiere({ premiere }: { premiere: CatalogShow['premiere'] }) {
  if (!premiere.date && !premiere.venue) return null
  const text = [premiere.date && formatPremiereDate(premiere.date), premiere.venue].filter(Boolean).join(', ')
  return (
    <Section id="premiere-h" title="Premiere">
      <p className="text-lg text-neutral-100 break-words">{text}</p>
    </Section>
  )
}

export default function CatalogShowBody({ show, live }: { show: CatalogShow; live?: boolean }) {
  const { links, summary } = show
  const extra = [
    links.official_site && { href: links.official_site, label: 'Official site' },
    { href: links.wikipedia, label: 'Wikipedia' },
    { href: links.wikidata, label: 'Wikidata' },
  ].filter((x): x is { href: string; label: string } => Boolean(x))
  const year = show.premiere.date?.slice(0, 4)
  const subtitle = [year, show.premiere.venue].filter(Boolean).join(' · ')

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10 space-y-6">
      <ShowHero title={show.title} eyebrow="Musical" subtitle={subtitle || undefined}>
        {live === false && (
          <p role="note" className="mt-4 rounded-lg border border-amber-400 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            Sample data: this page was built from test fixtures, not live Wikipedia data.
          </p>
        )}
      </ShowHero>

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <CreatedBy show={show} />
        <div className="space-y-6">
          <Premiere premiere={show.premiere} />
          {show.awards.length > 0 && (
            <Section id="awards-h" title="Awards">
              <AwardChips items={show.awards.map(a => ({ key: a.qid, label: a.name }))} />
            </Section>
          )}
        </div>
      </div>

      {summary && <WikipediaSummary summary={summary} />}
      <ShowLinks ibdb={links.ibdb} playbill={links.playbill} extra={extra} />
    </main>
  )
}
